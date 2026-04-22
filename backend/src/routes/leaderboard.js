import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', requireAuth, async (req, res) => {
  res.status(501).json({ error: 'not_implemented_yet' });
});

