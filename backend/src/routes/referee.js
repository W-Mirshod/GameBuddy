import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { refereeOnly } from '../middleware/refereeOnly.js';

export const refereeRouter = Router();

refereeRouter.get('/active', requireAuth, refereeOnly, async (req, res) => {
  res.status(501).json({ error: 'not_implemented_yet' });
});

