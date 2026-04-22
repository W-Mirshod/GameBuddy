import { prisma } from '../db.js';

const PLACEMENT_POINTS = { 1: 10, 2: 6, 3: 3 };

export async function addTournamentPointsForUser(userId, game, placement) {
  const participated = 1;
  const placementPts =
    placement != null && PLACEMENT_POINTS[placement] != null ? PLACEMENT_POINTS[placement] : 0;
  const delta = placementPts + participated;
  const isWin = placement === 1;

  for (const g of [game, 'overall']) {
    const existing = await prisma.leaderboardEntry.findUnique({
      where: { userId_game: { userId, game: g } },
    });
    const bestPlacement =
      placement == null
        ? existing?.bestPlacement ?? null
        : existing?.bestPlacement == null
          ? placement
          : Math.min(existing.bestPlacement, placement);

    await prisma.leaderboardEntry.upsert({
      where: { userId_game: { userId, game: g } },
      create: {
        userId,
        game: g,
        points: delta,
        tournamentsPlayed: 1,
        wins: isWin ? 1 : 0,
        bestPlacement: placement ?? null,
      },
      update: {
        points: { increment: delta },
        tournamentsPlayed: { increment: 1 },
        wins: { increment: isWin ? 1 : 0 },
        bestPlacement,
      },
    });
  }
}
