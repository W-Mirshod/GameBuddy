import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../index.js';

export const authRouter = Router();

const TelegramAuthSchema = z.object({
  initData: z.string().min(1),
});

function validateTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'missing_hash' };

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computed !== hash) return { ok: false, error: 'invalid_hash' };

  const userRaw = params.get('user');
  if (!userRaw) return { ok: false, error: 'missing_user' };

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return { ok: false, error: 'invalid_user_json' };
  }

  return { ok: true, user };
}

authRouter.post('/telegram', async (req, res) => {
  const parsed = TelegramAuthSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });
  if (!process.env.BOT_TOKEN) return res.status(500).json({ error: 'bot_token_missing' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'jwt_secret_missing' });

  const result = validateTelegramInitData(parsed.data.initData, process.env.BOT_TOKEN);
  if (!result.ok) return res.status(401).json({ error: 'invalid_init_data', reason: result.error });

  const telegramId = String(result.user.id);
  const username = result.user.username ? String(result.user.username) : null;
  const firstName = String(result.user.first_name || 'Player');

  const dbUser = await prisma.user.upsert({
    where: { telegramId },
    create: { telegramId, username, firstName },
    update: { username, firstName },
    include: { cs2Stats: true, dota2Stats: true, team: true, ownedTeam: true },
  });

  const token = jwt.sign(
    {
      userId: dbUser.id,
      telegramId: dbUser.telegramId,
      isAdmin: dbUser.isAdmin,
      isReferee: dbUser.isReferee,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  console.log('[auth] telegram login', dbUser.id);
  res.json({ token, user: dbUser });
});

