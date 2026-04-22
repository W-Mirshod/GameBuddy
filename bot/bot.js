import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.BOT_TOKEN;
if (!token) {
  console.log('[bot] BOT_TOKEN missing');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, 'Welcome to GG Arena.', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Open GG Arena',
            web_app: { url: process.env.FRONTEND_URL || 'http://localhost:5173' },
          },
        ],
      ],
    },
  });
});

bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'Commands: /start /tournaments /stats /help');
});

console.log('[bot] started');

