import { prisma } from '../index.js';
import {
  resolveVanityUrl,
  getSteamProfile,
  getCs2Stats,
  getDota2ProfileAndRecent,
  rankTierToMedal,
} from './steam.service.js';
import { steamId64ToSteamId32 } from '../utils/steamId.js';

export async function connectOrResolveSteamId64({ steamId64, vanityUrl }) {
  if (steamId64) return String(steamId64);
  if (vanityUrl) return await resolveVanityUrl(String(vanityUrl));
  return null;
}

export async function refreshSteamForUser(userId, steamId64, { force }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { cs2Stats: true, dota2Stats: true },
  });
  if (!user) return { ok: false, status: 404, error: 'not_found' };

  const preferredGame = user.preferredGame;
  if (preferredGame !== 'cs2' && preferredGame !== 'dota2') {
    return { ok: false, status: 400, error: 'preferred_game_required' };
  }

  const now = new Date();
  const lastFetched =
    preferredGame === 'cs2' ? user.cs2Stats?.lastFetched : user.dota2Stats?.lastFetched;
  if (!force && lastFetched && now.getTime() - lastFetched.getTime() < 24 * 60 * 60 * 1000) {
    return { ok: false, status: 429, error: 'steam_refresh_too_soon' };
  }

  const profile = await getSteamProfile(steamId64);
  if (!profile) return { ok: false, status: 400, error: 'steam_profile_not_found' };

  await prisma.user.update({
    where: { id: userId },
    data: {
      steamId64,
      steamId32: steamId64ToSteamId32(steamId64),
      steamUsername: profile.steamUsername,
      steamAvatar: profile.steamAvatar,
    },
  });

  if (preferredGame === 'cs2') {
    const cs2 = await getCs2Stats(steamId64);
    await prisma.cS2Stats.upsert({
      where: { userId },
      create: { userId, ...cs2, lastFetched: now },
      update: { ...cs2, lastFetched: now },
    });
  } else {
    const dota = await getDota2ProfileAndRecent(steamId64);
    await prisma.dota2Stats.upsert({
      where: { userId },
      create: {
        userId,
        mmr: dota.mmr,
        wins: dota.wins,
        losses: dota.losses,
        winRate: dota.winRate,
        favoriteHero: dota.favoriteHero,
        rankMedal: rankTierToMedal(dota.rankTier),
        lastFetched: now,
      },
      update: {
        mmr: dota.mmr,
        wins: dota.wins,
        losses: dota.losses,
        winRate: dota.winRate,
        favoriteHero: dota.favoriteHero,
        rankMedal: rankTierToMedal(dota.rankTier),
        lastFetched: now,
      },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { cs2Stats: true, dota2Stats: true, team: true, ownedTeam: true },
  });

  return { ok: true, user: updated };
}

