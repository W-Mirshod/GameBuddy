import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { prisma } from '../index.js';

export const teamsRouter = Router();

teamsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z
    .object({ name: z.string().min(2), game: z.enum(['cs2', 'dota2']) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const me = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!me) return res.status(404).json({ error: 'not_found' });
  if (me.teamId) return res.status(400).json({ error: 'already_in_team' });

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      game: parsed.data.game,
      ownerId: me.id,
      members: { connect: { id: me.id } },
    },
    include: { members: true, owner: true },
  });

  await prisma.user.update({ where: { id: me.id }, data: { teamId: team.id } });
  res.json(team);
});

teamsRouter.get('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_team_id' });

  const team = await prisma.team.findUnique({
    where: { id },
    include: { owner: true, members: { include: { cs2Stats: true, dota2Stats: true } } },
  });
  if (!team) return res.status(404).json({ error: 'not_found' });
  res.json(team);
});

teamsRouter.post('/:id/invite', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  if (!Number.isFinite(teamId)) return res.status(400).json({ error: 'invalid_team_id' });

  const parsed = z.object({ telegramUsername: z.string().min(2) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return res.status(404).json({ error: 'not_found' });
  if (team.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });

  const username = parsed.data.telegramUsername.replace(/^@/, '');
  const invitee = await prisma.user.findFirst({ where: { username } });

  const invite = await prisma.teamInvite.upsert({
    where: { teamId_telegramUsername: { teamId, telegramUsername: username } },
    create: {
      teamId,
      inviterId: req.user.userId,
      inviteeId: invitee?.id ?? null,
      telegramUsername: username,
      status: 'pending',
    },
    update: {
      inviterId: req.user.userId,
      inviteeId: invitee?.id ?? null,
      status: 'pending',
      respondedAt: null,
    },
  });

  console.log('[teams] invite', teamId, username);
  res.json(invite);
});

teamsRouter.post('/:id/accept-invite', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  if (!Number.isFinite(teamId)) return res.status(400).json({ error: 'invalid_team_id' });

  const me = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!me) return res.status(404).json({ error: 'not_found' });
  if (me.teamId) return res.status(400).json({ error: 'already_in_team' });
  if (!me.username) return res.status(400).json({ error: 'telegram_username_required' });

  const invite = await prisma.teamInvite.findUnique({
    where: { teamId_telegramUsername: { teamId, telegramUsername: me.username } },
  });
  if (!invite || invite.status !== 'pending') return res.status(404).json({ error: 'invite_not_found' });

  await prisma.teamInvite.update({
    where: { id: invite.id },
    data: { status: 'accepted', respondedAt: new Date(), inviteeId: me.id },
  });

  await prisma.user.update({ where: { id: me.id }, data: { teamId } });
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { owner: true, members: true },
  });
  res.json(team);
});

teamsRouter.delete('/:id/members/:userId', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  const userId = Number(req.params.userId);
  if (!Number.isFinite(teamId) || !Number.isFinite(userId)) return res.status(400).json({ error: 'invalid_id' });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return res.status(404).json({ error: 'not_found' });
  if (team.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
  if (userId === team.ownerId) return res.status(400).json({ error: 'cannot_remove_owner' });

  await prisma.user.update({ where: { id: userId }, data: { teamId: null } });
  res.json({ ok: true });
});

teamsRouter.delete('/:id', requireAuth, async (req, res) => {
  const teamId = Number(req.params.id);
  if (!Number.isFinite(teamId)) return res.status(400).json({ error: 'invalid_team_id' });

  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (!team) return res.status(404).json({ error: 'not_found' });
  if (team.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });

  await prisma.user.updateMany({ where: { teamId }, data: { teamId: null } });
  await prisma.teamInvite.deleteMany({ where: { teamId } });
  await prisma.team.delete({ where: { id: teamId } });
  res.json({ ok: true });
});

