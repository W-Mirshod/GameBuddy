import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { z } from 'zod';
import { prisma, io } from '../index.js';
import { generateBracket } from '../services/bracket.service.js';

export const tournamentsRouter = Router();

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

const CreateTournamentSchema = z.object({
  title: z.string().min(2),
  game: z.enum(['cs2', 'dota2']),
  dateTime: z.string().min(1),
  entryFee: z.number().nonnegative(),
  maxTeams: z.number().int().min(2).max(64).optional(),
});

tournamentsRouter.post('/', requireAuth, adminOnly, async (req, res) => {
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

  const teams = tournament.registrations.map((r) => r.team);
  if (teams.length !== 8) return res.status(400).json({ error: 'requires_8_teams' });

  const bracketData = generateBracket(
    teams.map((t) => ({ id: t.id, name: t.name, game: t.game })),
  );

  const updated = await prisma.tournament.update({
    where: { id },
    data: { bracketData, status: 'active' },
  });

  io.to(`tournament:${id}`).emit(`tournament:${id}:bracket_updated`, { bracketData });
  res.json(updated);
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

  const registration = await prisma.registration.create({
    data: {
      tournamentId,
      teamId: me.teamId,
      userId: me.id,
      paymentStatus: 'pending',
    },
  });

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

  console.log('[tournaments] registered', tournamentId, me.teamId);
  res.json(registration);
});

tournamentsRouter.post('/:id/checkin', requireAuth, async (req, res) => {
  const tournamentId = Number(req.params.id);
  if (!Number.isFinite(tournamentId)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const me = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { ownedTeam: true } });
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

  io.to(`tournament:${tournamentId}`).emit(`tournament:${tournamentId}:team_checked_in`, {
    teamId: me.teamId,
    teamName: null,
    totalCheckedIn: null,
  });

  res.json(updated);
});

tournamentsRouter.get('/:id/bracket', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_tournament_id' });

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return res.status(404).json({ error: 'not_found' });
  res.json(tournament.bracketData || null);
});

