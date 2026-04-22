import { Router } from 'express';
import multer from 'multer';
import { mkdirSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { refereeOnly } from '../middleware/refereeOnly.js';
import { z } from 'zod';
import { prisma } from '../db.js';
import { getIo } from '../ioSingleton.js';
import { generateBracket, advanceBracket } from '../services/bracket.service.js';
import { ocrQueue } from '../jobs/ocrProcess.job.js';
import { notifyUserById } from '../services/notify.service.js';

export const tournamentsRouter = Router();

try {
  mkdirSync('uploads', { recursive: true });
} catch {
  // ignore
}

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 8 * 1024 * 1024 },
});

tournamentsRouter.get('/recent-winners', requireAuth, async (req, res) => {
  const rows = await prisma.registration.findMany({
    where: { placement: 1, tournament: { status: 'finished' } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { team: true, tournament: true },
  });
  res.json(rows);
});

tournamentsRouter.get('/', requireAuth, async (req, res) => {
  const game = req.query.game ? String(req.query.game) : null;
  const status = req.query.status ? String(req.query.status) : null;

  const where = {
    ...(game ? { game } : {}),
    ...(status ? { status } : {}),
  };

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { dateTime: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });

  res.json(
    tournaments.map((t) => ({
      ...t,
      registrationCount: t._count.registrations,
      _count: undefined,
    })),
  );
});

tournamentsRouter.post('/', requireAuth, adminOnly, async (req, res) => {
  const CreateTournamentSchema = z.object({
    title: z.string().min(2),
    game: z.enum(['cs2', 'dota2']),
    dateTime: z.string().min(1),
    entryFee: z.number().nonnegative(),
    maxTeams: z.number().int().min(2).max(64).optional(),
  });
  const parsed = CreateTournamentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const dateTime = new Date(parsed.data.dateTime);
  if (Number.isNaN(dateTime.getTime())) return res.status(400).json({ error: 'invalid_dateTime' });
  const maxTeams = parsed.data.maxTeams ?? 8;
  const prizePool = parsed.data.entryFee * maxTeams * 0.8;

  const tournament = await prisma.tournament.create({
    data: {
      title: parsed.data.title,
      game: parsed.data.game,
      dateTime,
      entryFee: parsed.data.entryFee,
      maxTeams,
      prizePool,
    },
  });

  console.log('[tournaments] created', tournament.id);
  res.json(tournament);
});

tournamentsRouter.post('/:id/register', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  if (!Number.isFinite(tournamentId)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const me = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { team: { include: { members: true } }, ownedTeam: true },
  });
  if (!me) return res.status(404).json({ error: 'not_found' });
  if (!me.teamId || !me.team) return res.status(400).json({ error: 'team_required' });
  if (me.ownedTeam?.id !== me.teamId) return res.status(403).json({ error: 'captain_only' });
  if (me.team.members.length < 2) return res.status(400).json({ error: 'team_too_small' });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!tournament) return res.status(404).json({ error: 'not_found' });
  if (tournament.status !== 'open') return res.status(400).json({ error: 'tournament_not_open' });
  if (tournament.game !== me.team.game) return res.status(400).json({ error: 'game_mismatch' });
  if (tournament._count.registrations >= tournament.maxTeams) {
    return res.status(400).json({ error: 'tournament_full' });
  }

  const now = new Date();
  if (tournament.dateTime.getTime() - now.getTime() < 60 * 60 * 1000) {
    return res.status(400).json({ error: 'registration_closed' });
  }

  const dup = await prisma.registration.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId: me.teamId } },
  });
  if (dup) return res.status(400).json({ error: 'already_registered' });

  let registration;
  try {
    registration = await prisma.registration.create({
      data: {
        tournamentId,
        teamId: me.teamId,
        userId: me.id,
        paymentStatus: 'pending',
      },
    });
  } catch (e) {
    if (e?.code === 'P2002') return res.status(400).json({ error: 'already_registered' });
    throw e;
  }

  const amount = tournament.entryFee * me.team.members.length;
  await prisma.escrow.create({
    data: {
      userId: me.id,
      tournamentId,
      amount,
      status: 'locked',
      currency: 'USD',
    },
  });

  const payme = process.env.PAYME_NUMBER || '';
  const ref = `GGTURNIER-${registration.id}`;
  await notifyUserById(
    me.id,
    `✅ Team ${me.team.name} registered for ${tournament.title}!\nEntry fee: $${amount}\nSend payment to Payme: ${payme}\nReference: ${ref}\nDeadline: 2 hours`,
  );

  console.log('[tournaments] registered', tournamentId, me.teamId);
  res.json(registration);
});

tournamentsRouter.post('/:id/checkin', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  if (!Number.isFinite(tournamentId)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const me = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { ownedTeam: true, team: true },
  });
  if (!me?.teamId) return res.status(400).json({ error: 'team_required' });
  if (me.ownedTeam?.id !== me.teamId) return res.status(403).json({ error: 'captain_only' });

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return res.status(404).json({ error: 'not_found' });

  const now = new Date();
  const diffMs = tournament.dateTime.getTime() - now.getTime();
  if (diffMs > 30 * 60 * 1000 || diffMs < 0) return res.status(400).json({ error: 'checkin_window' });

  const registration = await prisma.registration.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId: me.teamId } },
  });
  if (!registration) return res.status(404).json({ error: 'registration_not_found' });
  if (registration.paymentStatus !== 'paid') return res.status(400).json({ error: 'payment_required' });

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { checkedIn: true, checkedInAt: now },
  });

  const checked = await prisma.registration.count({
    where: { tournamentId, checkedIn: true },
  });

  const io = getIo();
  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:team_checked_in`, {
    teamId: me.teamId,
    teamName: me.team?.name || null,
    totalCheckedIn: checked,
  });

  res.json(updated);
});

tournamentsRouter.post('/:id/start', requireAuth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { registrations: { include: { team: true } } },
  });
  if (!tournament) return res.status(404).json({ error: 'not_found' });
  if (tournament.status !== 'open' && tournament.status !== 'check_in') {
    return res.status(400).json({ error: 'invalid_status' });
  }

  const paidRegs = tournament.registrations.filter((r) => r.paymentStatus === 'paid');
  if (paidRegs.length !== 8) return res.status(400).json({ error: 'requires_8_paid_teams' });

  const teams = paidRegs.map((r) => r.team);
  const bracketData = generateBracket(
    teams.map((t) => ({ id: t.id, name: t.name, game: t.game })),
  );

  const r1 = bracketData.rounds[0]?.matches || [];
  const io = getIo();

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: { bracketData, status: 'active' },
    });
    for (const m of r1) {
      await tx.tournamentRoom.create({
        data: {
          tournamentId: id,
          matchRound: 1,
          team1Id: m.team1.id,
          team2Id: m.team2.id,
          bracketMatchKey: m.id,
          status: 'pending',
        },
      });
    }
  });

  io.to(`tournament:${id}`).emit(`tournament:${id}:bracket_updated`, { bracketData });
  const updated = await prisma.tournament.findUnique({ where: { id } });
  res.json(updated);
});

tournamentsRouter.post('/:id/rooms/:roomId/set', requireAuth, refereeOnly, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const roomDbId = Number(req.params.roomId);
  const parsed = z
    .object({ roomId: z.string().min(1), roomPassword: z.string().min(1) })
    .safeParse(req.body);
  if (!Number.isFinite(tournamentId) || !Number.isFinite(roomDbId) || !parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const room = await prisma.tournamentRoom.findFirst({
    where: { id: roomDbId, tournamentId },
    include: { tournament: true },
  });
  if (!room) return res.status(404).json({ error: 'not_found' });

  const updated = await prisma.tournamentRoom.update({
    where: { id: room.id },
    data: {
      roomId: parsed.data.roomId,
      roomPassword: parsed.data.roomPassword,
      status: 'room_set',
      releasedAt: new Date(),
    },
    include: { tournament: true },
  });

  const io = getIo();
  const team1 = await prisma.team.findUnique({ where: { id: room.team1Id } });
  const team2 = await prisma.team.findUnique({ where: { id: room.team2Id } });
  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:room_ready`, {
    roomId: roomDbId,
    matchRound: room.matchRound,
    team1,
    team2,
  });

  res.json(updated);
});

tournamentsRouter.post('/:id/rooms/:roomId/start', requireAuth, refereeOnly, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const roomDbId = Number(req.params.roomId);
  if (!Number.isFinite(tournamentId) || !Number.isFinite(roomDbId)) {
    return res.status(400).json({ error: 'invalid_params' });
  }

  const room = await prisma.tournamentRoom.updateMany({
    where: { id: roomDbId, tournamentId },
    data: { status: 'active' },
  });
  if (room.count === 0) return res.status(404).json({ error: 'not_found' });

  const io = getIo();
  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:match_started`, { roomId: roomDbId });
  res.json({ ok: true });
});

tournamentsRouter.post('/:id/rooms/:roomId/complete', requireAuth, refereeOnly, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const roomDbId = Number(req.params.roomId);
  const parsed = z
    .object({
      winnerId: z.number().int(),
      team1Score: z.number().optional(),
      team2Score: z.number().optional(),
    })
    .safeParse(req.body);
  if (!Number.isFinite(tournamentId) || !Number.isFinite(roomDbId) || !parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const room = await prisma.tournamentRoom.findFirst({
    where: { id: roomDbId, tournamentId },
  });
  if (!room) return res.status(404).json({ error: 'not_found' });
  if (parsed.data.winnerId !== room.team1Id && parsed.data.winnerId !== room.team2Id) {
    return res.status(400).json({ error: 'invalid_winner' });
  }

  const winnerTeam = await prisma.team.findUnique({ where: { id: parsed.data.winnerId } });
  if (!winnerTeam) return res.status(404).json({ error: 'winner_not_found' });

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  const bracketData = tournament.bracketData;
  if (!bracketData || typeof bracketData !== 'object') return res.status(400).json({ error: 'no_bracket' });

  const key = room.bracketMatchKey || 'm1';
  advanceBracket(bracketData, key, {
    id: winnerTeam.id,
    name: winnerTeam.name,
    game: winnerTeam.game,
  });

  await prisma.tournamentRoom.update({
    where: { id: roomDbId },
    data: { status: 'finished', winnerId: parsed.data.winnerId },
  });

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { bracketData },
  });

  const io = getIo();
  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:result_confirmed`, {
    roomId: roomDbId,
    winnerId: parsed.data.winnerId,
    nextMatch: null,
  });
  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:bracket_updated`, { bracketData });

  res.json({ ok: true, bracketData });
});

tournamentsRouter.post('/:id/rooms/:roomId/lobby-ready', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  const roomDbId = Number(req.params.roomId);
  if (!Number.isFinite(tournamentId) || !Number.isFinite(roomDbId)) {
    return res.status(400).json({ error: 'invalid_params' });
  }

  const room = await prisma.tournamentRoom.findFirst({ where: { id: roomDbId, tournamentId } });
  if (!room) return res.status(404).json({ error: 'not_found' });

  await prisma.roomLobbyReady.upsert({
    where: { roomId_userId: { roomId: roomDbId, userId: req.user.userId } },
    create: { roomId: roomDbId, userId: req.user.userId },
    update: { readyAt: new Date() },
  });

  const count = await prisma.roomLobbyReady.count({ where: { roomId: roomDbId } });
  const io = getIo();
  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:lobby_ready`, {
    roomId: roomDbId,
    count,
  });

  res.json({ ok: true, count });
});

tournamentsRouter.post('/:id/results/upload', requireAuth, upload.single('screenshot'), async (req, res) => {
  const tournamentId = Number(req.params.id);
  const roomDbId = Number(req.body.roomId);
  if (!Number.isFinite(tournamentId) || !Number.isFinite(roomDbId)) {
    return res.status(400).json({ error: 'invalid_body' });
  }
  if (!req.file) return res.status(400).json({ error: 'screenshot_required' });

  const room = await prisma.tournamentRoom.findFirst({
    where: { id: roomDbId, tournamentId },
    include: { tournament: true },
  });
  if (!room) return res.status(404).json({ error: 'room_not_found' });

  const reg = await prisma.registration.findFirst({
    where: {
      tournamentId,
      userId: req.user.userId,
      paymentStatus: 'paid',
    },
    include: { team: true },
  });
  if (!reg?.teamId) return res.status(403).json({ error: 'not_registered_paid' });
  if (reg.teamId !== room.team1Id && reg.teamId !== room.team2Id) {
    return res.status(403).json({ error: 'not_in_match' });
  }

  const ext = path.extname(req.file.originalname || '') || '.png';
  const publicName = `${randomUUID()}${ext}`;
  const finalPath = path.join('uploads', publicName);
  const fs = await import('fs/promises');
  await fs.rename(req.file.path, finalPath).catch(() => {});

  const base = process.env.API_PUBLIC_URL || '';
  const imageUrl = `${base}/uploads/${publicName}`;

  const job = await ocrQueue.add('ocr', {
    filePath: finalPath,
    tournamentId,
    userId: req.user.userId,
    tournamentRoomDbId: roomDbId,
    imageUrl,
  });

  console.log('[tournaments] ocr queued', job.id);
  res.json({ jobId: String(job.id), status: 'processing' });
});

tournamentsRouter.get('/:id/bracket', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return res.status(404).json({ error: 'not_found' });
  res.json(tournament.bracketData || null);
});

tournamentsRouter.get('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: { include: { team: { include: { members: true, owner: true } }, user: true } },
      rooms: true,
      matchResults: true,
      escrows: true,
    },
  });
  if (!tournament) return res.status(404).json({ error: 'not_found' });
  res.json(tournament);
});
