import { createQueue } from './queue.js';
import { prisma } from '../db.js';
import { refundTournamentEscrows } from '../services/escrow.service.js';
import { notifyUserById } from '../services/notify.service.js';

export const tournamentRulesQueue = createQueue('tournament_rules');

tournamentRulesQueue.process(async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ['open', 'check_in'] },
      dateTime: { gt: now, lte: windowEnd },
    },
    include: { registrations: { include: { user: true } } },
  });

  for (const t of tournaments) {
    if (t.registrations.length >= 4) continue;
    console.log('[tournamentRules] auto-cancel', t.id);
    await refundTournamentEscrows(t.id);
    await prisma.tournament.update({ where: { id: t.id }, data: { status: 'cancelled' } });
    for (const r of t.registrations) {
      await notifyUserById(
        r.userId,
        `❌ ${t.title} has been cancelled.\nFull refund will be processed within 24 hours.`,
      );
    }
  }
});

export async function registerTournamentRulesScheduler() {
  const existing = await tournamentRulesQueue.getRepeatableJobs();
  const has = existing.some((j) => j.name === 'rules_tick');
  if (!has) {
    await tournamentRulesQueue.add(
      'rules_tick',
      {},
      { repeat: { every: 10 * 60 * 1000 }, jobId: 'rules_tick' },
    );
    console.log('[tournamentRules] scheduled rules_tick every 10m');
  }
  tournamentRulesQueue.on('error', (e) =>
    console.log('[tournamentRules] queue error', e?.message || e),
  );
}
