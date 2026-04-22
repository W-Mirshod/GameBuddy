import { createQueue } from './queue.js';
import { prisma } from '../db.js';
import { refreshSteamForUser } from '../services/userSteam.service.js';

export const steamRefreshQueue = createQueue('steam_refresh', { concurrency: 1 });

steamRefreshQueue.process(async (job) => {
  const { userId } = job.data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.steamId64) return;

  console.log('[steamRefresh] processing', userId);
  const result = await refreshSteamForUser(userId, user.steamId64, { force: false });
  if (!result.ok && result.status !== 429) {
    console.log('[steamRefresh] failed', userId, result.error);
  }
});

export async function enqueueDailyRefresh() {
  const activeSince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: { steamId64: { not: null }, updatedAt: { gte: activeSince } },
    select: { id: true },
  });

  console.log('[steamRefresh] enqueue', users.length);
  for (const u of users) {
    await steamRefreshQueue.add('refresh_user', { userId: u.id });
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function registerSteamRefreshScheduler() {
  setTimeout(() => {
    enqueueDailyRefresh().catch((e) => console.log('[steamRefresh] enqueue error', e?.message || e));
  }, 60_000);

  setInterval(() => {
    enqueueDailyRefresh().catch((e) => console.log('[steamRefresh] enqueue error', e?.message || e));
  }, DAY_MS);

  console.log('[steamRefresh] scheduler: refresh every 24h (first run ~1min after startup)');
}
