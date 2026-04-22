import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { prisma } from '../db.js';
import { notifyUserById } from '../services/notify.service.js';

export const paymentsRouter = Router();

paymentsRouter.post('/confirm/:escrowId', requireAuth, adminOnly, async (req, res) => {
  const escrowId = Number(req.params.escrowId);
  if (!Number.isFinite(escrowId)) return res.status(400).json({ error: 'invalid_escrow_id' });

  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    include: { tournament: true },
  });
  if (!escrow) return res.status(404).json({ error: 'not_found' });

  const reg = await prisma.registration.findFirst({
    where: { tournamentId: escrow.tournamentId, userId: escrow.userId },
  });
  if (!reg) return res.status(404).json({ error: 'registration_not_found' });

  await prisma.$transaction([
    prisma.escrow.update({
      where: { id: escrowId },
      data: { paymentRef: String(req.body?.paymentRef || 'manual'), status: 'locked' },
    }),
    prisma.registration.update({
      where: { id: reg.id },
      data: { paymentStatus: 'paid' },
    }),
  ]);

  await notifyUserById(
    escrow.userId,
    `💰 Payment confirmed! Your spot is locked in.\nTournament: ${escrow.tournament.title}\nDate: ${escrow.tournament.dateTime.toISOString()} UTC\nWe'll send room code 30 minutes before start.`,
  );

  console.log('[payments] confirmed', escrowId);
  res.json({ ok: true });
});

paymentsRouter.post('/refund/:escrowId', requireAuth, adminOnly, async (req, res) => {
  const escrowId = Number(req.params.escrowId);
  if (!Number.isFinite(escrowId)) return res.status(400).json({ error: 'invalid_escrow_id' });

  const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
  if (!escrow) return res.status(404).json({ error: 'not_found' });

  const reg = await prisma.registration.findFirst({
    where: { tournamentId: escrow.tournamentId, userId: escrow.userId },
  });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.escrow.update({
      where: { id: escrowId },
      data: { status: 'refunded', releasedAt: now },
    });
    if (reg) {
      await tx.registration.update({
        where: { id: reg.id },
        data: { paymentStatus: 'refunded' },
      });
    }
  });

  if (reg) {
    await notifyUserById(escrow.userId, `Refund processed for tournament registration.`);
  }

  console.log('[payments] refunded', escrowId);
  res.json({ ok: true });
});
