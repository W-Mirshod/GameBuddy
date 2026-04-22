import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', requireAuth, async (req, res) => {
  const game = req.query.game ? String(req.query.game) : 'overall';
  const period = req.query.period ? String(req.query.period) : 'all';

  let since = null;
  if (period === 'week') since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'month') since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const whereGame = game === 'overall' ? { game: 'overall' } : { game };

  const top = await prisma.leaderboardEntry.findMany({
    where: {
      ...whereGame,
      ...(since ? { updatedAt: { gte: since } } : {}),
    },
    orderBy: { points: 'desc' },
    take: 50,
    include: { user: { include: { cs2Stats: true, dota2Stats: true } } },
  });

  const meRow = await prisma.leaderboardEntry.findUnique({
    where: { userId_game: { userId: req.user.userId, game: game === 'overall' ? 'overall' : game } },
  });

  const rankAbove = await prisma.leaderboardEntry.count({
    where: {
      ...whereGame,
      ...(since ? { updatedAt: { gte: since } } : {}),
      points: { gt: meRow?.points ?? -1 },
    },
  });
  const myRank = meRow ? rankAbove + 1 : null;

  res.json({ top, me: meRow ? { ...meRow, rank: myRank } : { rank: null, points: 0 } });
});
