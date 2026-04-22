import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { connectOrResolveSteamId64, refreshSteamForUser } from '../services/userSteam.service.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      cs2Stats: true,
      dota2Stats: true,
      team: true,
      ownedTeam: true,
      registrations: { include: { tournament: true } },
    },
  });
  res.json(user);
});

const UpdateMeSchema = z.object({
  language: z.string().nullable().optional(),
  activeHours: z.string().nullable().optional(),
  lookingFor: z.string().nullable().optional(),
  preferredGame: z.enum(['cs2', 'dota2']).nullable().optional(),
});

usersRouter.put('/me', requireAuth, async (req, res) => {
  const parsed = UpdateMeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  const updated = await prisma.user.update({
    where: { id: req.user.userId },
    data: parsed.data,
    include: {
      cs2Stats: true,
      dota2Stats: true,
      team: true,
      ownedTeam: true,
      registrations: { include: { tournament: true } },
    },
  });
  res.json(updated);
});

const ConnectSteamSchema = z
  .object({
    steamId64: z.string().min(1).optional(),
    vanityUrl: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.steamId64 || v.vanityUrl), { message: 'steamId64_or_vanityUrl_required' });

usersRouter.post('/me/steam', requireAuth, async (req, res) => {
  if (!process.env.STEAM_API_KEY) return res.status(500).json({ error: 'steam_api_key_missing' });
  const parsed = ConnectSteamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const steamId64 = await connectOrResolveSteamId64(parsed.data);
  if (!steamId64) return res.status(400).json({ error: 'steam_id_not_resolved' });

  console.log('[steam] connect', req.user.userId);
  const refreshed = await refreshSteamForUser(req.user.userId, steamId64, { force: true });
  if (!refreshed.ok) return res.status(refreshed.status).json({ error: refreshed.error });
  res.json(refreshed.user);
});

usersRouter.get('/me/steam/refresh', requireAuth, async (req, res) => {
  if (!process.env.STEAM_API_KEY) return res.status(500).json({ error: 'steam_api_key_missing' });
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user?.steamId64) return res.status(400).json({ error: 'steam_not_connected' });

  console.log('[steam] refresh', req.user.userId);
  const refreshed = await refreshSteamForUser(req.user.userId, user.steamId64, { force: true });
  if (!refreshed.ok) return res.status(refreshed.status).json({ error: refreshed.error });
  res.json(refreshed.user);
});

usersRouter.get('/search', requireAuth, async (req, res) => {
  const game = req.query.game ? String(req.query.game) : null;
  const language = req.query.language ? String(req.query.language) : null;
  const activeHours = req.query.activeHours ? String(req.query.activeHours) : null;
  const lookingFor = req.query.lookingFor ? String(req.query.lookingFor) : null;
  const rankMin = req.query.rankMin != null ? Number(req.query.rankMin) : null;
  const rankMax = req.query.rankMax != null ? Number(req.query.rankMax) : null;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const skip = (page - 1) * pageSize;

  const and = [{ id: { not: req.user.userId } }, { steamId64: { not: null } }];
  if (game) and.push({ preferredGame: game });
  if (language) and.push({ language: { contains: language, mode: 'insensitive' } });
  if (activeHours) and.push({ activeHours });
  if (lookingFor) and.push({ lookingFor });
  if (game === 'cs2' && (rankMin != null || rankMax != null)) {
    const kd = {};
    if (rankMin != null && Number.isFinite(rankMin)) kd.gte = rankMin;
    if (rankMax != null && Number.isFinite(rankMax)) kd.lte = rankMax;
    if (Object.keys(kd).length) and.push({ cs2Stats: { kdRatio: kd } });
  }
  if (game === 'dota2' && (rankMin != null || rankMax != null)) {
    const mmr = {};
    if (rankMin != null && Number.isFinite(rankMin)) mmr.gte = rankMin;
    if (rankMax != null && Number.isFinite(rankMax)) mmr.lte = rankMax;
    if (Object.keys(mmr).length) and.push({ dota2Stats: { mmr } });
  }

  const where = { AND: and };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      include: { cs2Stats: true, dota2Stats: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  res.json({ items: rows, total, page, pageSize });
});

usersRouter.put('/me/team/leave', requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!me) return res.status(404).json({ error: 'not_found' });
  if (!me.teamId) return res.status(400).json({ error: 'not_in_team' });

  const team = await prisma.team.findUnique({ where: { id: me.teamId } });
  if (team?.ownerId === me.id) return res.status(400).json({ error: 'owner_must_disband' });

  await prisma.user.update({ where: { id: me.id }, data: { teamId: null } });
  res.json({ ok: true });
});
