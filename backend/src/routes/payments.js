import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

export const paymentsRouter = Router();

paymentsRouter.post('/confirm/:escrowId', requireAuth, adminOnly, async (req, res) => {
  res.status(501).json({ error: 'not_implemented_yet' });
});

