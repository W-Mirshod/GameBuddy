import axios from 'axios';
import { steamId64ToSteamId32 } from '../utils/steamId.js';

const steamApi = axios.create({
  baseURL: 'https://api.steampowered.com',
  timeout: 15000,
});

const openDotaApi = axios.create({
  baseURL: 'https://api.opendota.com/api',
  timeout: 15000,
});

export async function resolveVanityUrl(vanityUrl) {
  const { data } = await steamApi.get('/ISteamUser/ResolveVanityURL/v1/', {
    params: { key: process.env.STEAM_API_KEY, vanityurl: vanityUrl },
  });
  const steamid = data?.response?.steamid;
  if (!steamid) return null;
  return String(steamid);
}

export async function getSteamProfile(steamId64) {
  const { data } = await steamApi.get('/ISteamUser/GetPlayerSummaries/v2/', {
    params: { key: process.env.STEAM_API_KEY, steamids: steamId64 },
  });
  const player = data?.response?.players?.[0];
  if (!player) return null;
  return {
    steamUsername: player.personaname ? String(player.personaname) : null,
    steamAvatar: player.avatarfull ? String(player.avatarfull) : null,
  };
}

export async function getCs2Stats(steamId64) {
  const { data } = await steamApi.get('/ISteamUserStats/GetUserStatsForGame/v2/', {
    params: { key: process.env.STEAM_API_KEY, steamid: steamId64, appid: 730 },
  });

  const stats = data?.playerstats?.stats || [];
  const byName = new Map(stats.map((s) => [s.name, s.value]));

  const kills = Number(byName.get('total_kills') || 0);
  const deaths = Number(byName.get('total_deaths') || 0);
  const wins = Number(byName.get('total_wins') || 0);
  const totalMatches = Number(byName.get('total_matches_played') || 0);

  const kdRatio = deaths > 0 ? kills / deaths : kills;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  return {
    kills,
    deaths,
    kdRatio,
    wins,
    totalMatches,
    winRate,
    favoriteMap: null,
  };
}

export async function getDota2ProfileAndRecent(steamId64) {
  const steamId32 = steamId64ToSteamId32(steamId64);
  const [profileResp, matchesResp] = await Promise.all([
    openDotaApi.get(`/players/${steamId32}`),
    openDotaApi.get(`/players/${steamId32}/matches`, { params: { limit: 20, significant: 1 } }),
  ]);

  const profile = profileResp.data || {};
  const matches = Array.isArray(matchesResp.data) ? matchesResp.data : [];

  const mmrRaw = profile?.solo_competitive_rank ?? profile?.mmr_estimate?.estimate ?? 0;
  const mmr = Number(mmrRaw || 0);

  const wl = profile?.wl;
  const wlWins = wl?.win != null ? Number(wl.win) : null;
  const wlLosses = wl?.lose != null ? Number(wl.lose) : null;

  let wins = 0;
  let losses = 0;
  for (const m of matches) {
    if (m?.radiant_win == null) continue;
    const isRadiant = Boolean(m?.player_slot != null && Number(m.player_slot) < 128);
    const didWin = isRadiant ? Boolean(m.radiant_win) : !Boolean(m.radiant_win);
    if (didWin) wins += 1;
    else losses += 1;
  }

  if (wlWins != null && wlLosses != null) {
    wins = wlWins;
    losses = wlLosses;
  }

  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const rankTier = Number(profile?.rank_tier || 0);

  return {
    mmr,
    wins,
    losses,
    winRate,
    favoriteHero: null,
    rankTier,
  };
}

export function rankTierToMedal(rankTier) {
  if (!rankTier) return null;
  if (rankTier >= 80) return 'Immortal';
  if (rankTier >= 70) return 'Divine';
  if (rankTier >= 60) return 'Ancient';
  if (rankTier >= 50) return 'Legend';
  if (rankTier >= 40) return 'Archon';
  if (rankTier >= 30) return 'Crusader';
  if (rankTier >= 20) return 'Guardian';
  if (rankTier >= 10) return 'Herald';
  return null;
}

