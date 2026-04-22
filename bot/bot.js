import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const token = process.env.BOT_TOKEN;
if (!token) {
  console.log('[bot] BOT_TOKEN missing');
  process.exit(1);
}

const prisma = new PrismaClient();
const bot = new TelegramBot(token, { polling: { autoStart: false } });

bot.on('polling_error', (err) => {
  console.log('[bot] polling_error', err?.message || err);
});

const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isAdmin(msg) {
  return adminIds.includes(String(msg.from?.id));
}

const miniUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const miniAppHttps = miniUrl.startsWith('https://');

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const text = 'Welcome to GG Arena.';
  if (miniAppHttps) {
    try {
      await bot.sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [[{ text: 'Open GG Arena', web_app: { url: miniUrl } }]],
        },
      });
      return;
    } catch (e) {
      console.log('[bot] /start web_app failed', e?.response?.body || e?.message || e);
    }
  }
  await bot.sendMessage(
    chatId,
    miniAppHttps
      ? text
      : `${text}\n\nSet FRONTEND_URL to a public https:// URL for the Open Mini App button in chat.`,
  );
});

bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    'Commands: /start /tournaments /stats /help\nAdmins: /admin tournaments, /admin confirm [escrowId], /admin refund [escrowId], /admin setreferee [telegramId]',
  );
});

bot.onText(/\/tournaments/, async (msg) => {
  const rows = await prisma.tournament.findMany({
    where: { status: 'open' },
    orderBy: { dateTime: 'asc' },
    take: 10,
  });
  if (!rows.length) {
    await bot.sendMessage(msg.chat.id, 'No open tournaments.');
    return;
  }
  const lines = rows.map((t) => `• ${t.title} (${t.game}) — ${t.dateTime.toISOString()}`);
  await bot.sendMessage(msg.chat.id, `Upcoming:\n${lines.join('\n')}`);
});

bot.onText(/\/stats/, async (msg) => {
  const tg = String(msg.from?.id);
  const user = await prisma.user.findUnique({
    where: { telegramId: tg },
    include: { leaderboardPoints: true },
  });
  if (!user) {
    await bot.sendMessage(msg.chat.id, 'Open the Mini App once to create your profile.');
    return;
  }
  const pts = user.leaderboardPoints.reduce((s, e) => s + e.points, 0);
  await bot.sendMessage(msg.chat.id, `Points (sum): ${pts}\nSteam: ${user.steamId64 ? 'linked' : 'not linked'}`);
});

bot.onText(/\/admin tournaments/, async (msg) => {
  if (!isAdmin(msg)) return;
  const rows = await prisma.tournament.findMany({ orderBy: { id: 'desc' }, take: 20 });
  const lines = rows.map((t) => `#${t.id} ${t.title} [${t.status}]`);
  await bot.sendMessage(msg.chat.id, lines.join('\n') || 'none');
});

bot.onText(/\/admin confirm (\d+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const escrowId = Number(match[1]);
  const escrow = await prisma.escrow.findUnique({ where: { id: escrowId }, include: { tournament: true } });
  if (!escrow) return bot.sendMessage(msg.chat.id, 'Escrow not found');
  const reg = await prisma.registration.findFirst({
    where: { tournamentId: escrow.tournamentId, userId: escrow.userId },
  });
  if (!reg) return bot.sendMessage(msg.chat.id, 'Registration not found');
  await prisma.$transaction([
    prisma.escrow.update({ where: { id: escrowId }, data: { paymentRef: 'admin_bot' } }),
    prisma.registration.update({ where: { id: reg.id }, data: { paymentStatus: 'paid' } }),
  ]);
  await bot.sendMessage(msg.chat.id, `Confirmed escrow #${escrowId}`);
});

bot.onText(/\/admin refund (\d+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const escrowId = Number(match[1]);
  const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
  if (!escrow) return bot.sendMessage(msg.chat.id, 'Escrow not found');
  const reg = await prisma.registration.findFirst({
    where: { tournamentId: escrow.tournamentId, userId: escrow.userId },
  });
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.escrow.update({
      where: { id: escrowId },
      data: { status: 'refunded', releasedAt: now },
    });
    if (reg) await tx.registration.update({ where: { id: reg.id }, data: { paymentStatus: 'refunded' } });
  });
  await bot.sendMessage(msg.chat.id, `Refunded escrow #${escrowId}`);
});

bot.onText(/\/admin setreferee (.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const telegramId = match[1].trim();
  await prisma.user.updateMany({
    where: { telegramId },
    data: { isReferee: true },
  });
  await bot.sendMessage(msg.chat.id, `Referee flag set for telegramId ${telegramId}`);
});

async function main() {
  try {
    await bot.deleteWebHook({ drop_pending_updates: false });
  } catch (e) {
    console.log('[bot] deleteWebHook failed', e?.message || e);
  }
  await bot.startPolling();
  console.log('[bot] started');
}

main().catch((e) => {
  console.error('[bot] fatal', e);
  process.exit(1);
});
