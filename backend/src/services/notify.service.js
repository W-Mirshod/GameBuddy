import axios from 'axios';
import { prisma } from '../db.js';

export async function sendTelegramMessage(telegramId, text, extra = {}) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.log('[notify] BOT_TOKEN missing, skip send');
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: telegramId,
      text,
      ...extra,
    });
  } catch (e) {
    console.log('[notify] send failed', e?.response?.data || e?.message || e);
  }
}

export async function notifyUserById(userId, text, extra = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await sendTelegramMessage(user.telegramId, text, extra);
}

export function miniAppKeyboard(url) {
  return {
    inline_keyboard: [[{ text: 'Open GG Arena', web_app: { url } }]],
  };
}
