import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { refereeOnly } from '../middleware/refereeOnly.js';
import { prisma } from '../db.js';
import { addTournamentPointsForUser } from '../services/leaderboard.service.js';
import { getIo } from '../ioSingleton.js';

export const refereeRouter = Router();

refereeRouter.get('/active', requireAuth, refereeOnly, async (req, res) => {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ['active', 'check_in', 'open'] } },
    include: {
      rooms: true,
      registrations: { where: { checkedIn: true } },
    },
  });

  const flagged = await prisma.matchResult.count({
    where: { status: 'ai_flagged' },
  });

  const needsAttention = tournaments.map((t) => ({
    id: t.id,
    title: t.title,
    game: t.game,
    status: t.status,
    roomsPending: t.rooms.filter((r) => r.status === 'pending' || r.status === 'room_set').length,
    checkedInTeams: t.registrations.length,
  }));

  res.json({ tournaments: needsAttention, flaggedCount: flagged });
});

refereeRouter.get('/results/flagged', requireAuth, refereeOnly, async (req, res) => {
  const rows = await prisma.matchResult.findMany({
    where: { status: 'ai_flagged' },
    orderBy: { aiConfidence: 'asc' },
    include: {
      user: true,
      tournament: true,
      room: { include: { tournament: true } },
    },
  });
  res.json(rows);
});

refereeRouter.get('/disputes', requireAuth, refereeOnly, async (req, res) => {
  const rows = await prisma.matchResult.findMany({
    where: { status: { in: ['disputed', 'rejected'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      tournament: true,
      room: true,
    },
  });
  res.json(rows);
});

refereeRouter.post('/results/:id/confirm', requireAuth, refereeOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });

  const mr = await prisma.matchResult.findUnique({
    where: { id },
    include: { tournament: true },
  });
  if (!mr) return res.status(404).json({ error: 'not_found' });

  await prisma.matchResult.update({
    where: { id },
    data: {
      status: 'human_confirmed',
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
    },
  });

  const placement = mr.placement ?? null;
  if (placement != null) {
    await addTournamentPointsForUser(mr.userId, mr.tournament.game, placement);
  }

  const io = getIo();
  io.to(`tournament:${mr.tournamentId}`).emit(`tournament:${mr.tournamentId}:result_confirmed`, {
    roomId: mr.roomId,
    winnerId: null,
    nextMatch: null,
  });

  res.json({ ok: true });
});

refereeRouter.post('/results/:id/reject', requireAuth, refereeOnly, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = z.object({ note: z.string().min(1) }).safeParse(req.body);
  if (!Number.isFinite(id) || !parsed.success) return res.status(400).json({ error: 'invalid_body' });

  await prisma.matchResult.update({
    where: { id },
    data: {
      status: 'rejected',
      refereeNote: parsed.data.note,
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
    },
  });

  res.json({ ok: true });
});

refereeRouter.post('/results/:id/override', requireAuth, refereeOnly, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = z
    .object({
      placement: z.number().int().optional(),
      kills: z.number().int().optional(),
      note: z.string().optional(),
    })
    .safeParse(req.body);
  if (!Number.isFinite(id) || !parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const mr = await prisma.matchResult.findUnique({
    where: { id },
    include: { tournament: true },
  });
  if (!mr) return res.status(404).json({ error: 'not_found' });

  await prisma.matchResult.update({
    where: { id },
    data: {
      placement: parsed.data.placement ?? mr.placement,
      kills: parsed.data.kills ?? mr.kills,
      refereeNote: parsed.data.note ?? mr.refereeNote,
      status: 'human_confirmed',
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
    },
  });

  if (parsed.data.placement != null) {
    await addTournamentPointsForUser(mr.userId, mr.tournament.game, parsed.data.placement);
  }

  res.json({ ok: true });
});
