import { prisma } from '../db.js';

export async function refundTournamentEscrows(tournamentId) {
  const now = new Date();
  await prisma.$transaction([
    prisma.escrow.updateMany({
      where: { tournamentId, status: 'locked' },
      data: { status: 'refunded', releasedAt: now },
    }),
    prisma.registration.updateMany({
      where: { tournamentId },
      data: { paymentStatus: 'refunded' },
    }),
  ]);
}

export async function releaseEscrowForWinner(tournamentId, tournamentRoomDbId, extracted) {
  console.log('[escrow] releaseEscrowForWinner', tournamentId, tournamentRoomDbId, extracted?.match_id);
}
