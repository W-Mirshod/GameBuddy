import { createQueue } from './queue.js';
import { prisma } from '../db.js';
import { refreshSteamForUser } from '../services/userSteam.service.js';

export const steamRefreshQueue = createQueue('steam_refresh');

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

export async function registerSteamRefreshScheduler() {
  const existing = await steamRefreshQueue.getRepeatableJobs();
  const hasDaily = existing.some((j) => j.name === 'daily_refresh');
  if (!hasDaily) {
    await steamRefreshQueue.add(
      'daily_refresh',
      {},
      { repeat: { every: 24 * 60 * 60 * 1000 }, jobId: 'daily_refresh' },
    );
    console.log('[steamRefresh] scheduled daily_refresh');
  }

  steamRefreshQueue.on('error', (e) => console.log('[steamRefresh] queue error', e?.message || e));
}

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

steamRefreshQueue.on('global:completed', async (jobId) => {
  if (String(jobId).includes('daily_refresh')) {
    await enqueueDailyRefresh();
  }
});

