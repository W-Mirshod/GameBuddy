export function steamId64ToSteamId32(steamId64) {
  return (BigInt(steamId64) - 76561197960265728n).toString();
}

