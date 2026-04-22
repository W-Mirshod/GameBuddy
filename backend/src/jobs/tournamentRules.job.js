import { prisma } from '../db.js';
import { refundTournamentEscrows } from '../services/escrow.service.js';
import { notifyUserById } from '../services/notify.service.js';

const TEN_MIN_MS = 10 * 60 * 1000;

async function runRulesTick() {
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
}

export async function registerTournamentRulesScheduler() {
  setTimeout(() => {
    runRulesTick().catch((e) => console.log('[tournamentRules] tick error', e?.message || e));
  }, 15_000);

  setInterval(() => {
    runRulesTick().catch((e) => console.log('[tournamentRules] tick error', e?.message || e));
  }, TEN_MIN_MS);

  console.log('[tournamentRules] scheduler: tick every 10m (first ~15s after startup)');
}
