import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RankBadge } from '../components/RankBadge.jsx';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [steamInput, setSteamInput] = useState('');
  const [prefs, setPrefs] = useState({
    preferredGame: user?.preferredGame || 'cs2',
    language: user?.language || '',
    activeHours: user?.activeHours || '',
    lookingFor: user?.lookingFor || '',
  });

  useEffect(() => {
    if (!user) return;
    setPrefs({
      preferredGame: user.preferredGame || 'cs2',
      language: user.language || '',
      activeHours: user.activeHours || '',
      lookingFor: user.lookingFor || '',
    });
  }, [user]);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      prefs.preferredGame !== (user.preferredGame || 'cs2') ||
      prefs.language !== (user.language || '') ||
      prefs.activeHours !== (user.activeHours || '') ||
      prefs.lookingFor !== (user.lookingFor || '')
    );
  }, [user, prefs]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.MainButton) return undefined;
    if (dirty) {
      tg.MainButton.setText('Save Profile');
      tg.MainButton.show();
      const onClick = async () => {
        await api.put('/users/me', prefs);
        await refreshUser();
        tg.MainButton.hide();
      };
      tg.MainButton.onClick(onClick);
      return () => {
        tg.MainButton.offClick(onClick);
        tg.MainButton.hide();
      };
    }
    tg.MainButton.hide();
    return undefined;
  }, [dirty, prefs, refreshUser]);

  const connectSteam = async () => {
    const body = /^\d+$/.test(steamInput.trim())
      ? { steamId64: steamInput.trim() }
      : { vanityUrl: steamInput.trim() };
    try {
      await api.post('/users/me/steam', body);
      await refreshUser();
      setSteamInput('');
    } catch (e) {
      alert(e?.response?.data?.error || 'failed');
    }
  };

  const createTeam = async () => {
    const name = prompt('Team name?');
    if (!name) return;
    const game = prefs.preferredGame === 'dota2' ? 'dota2' : 'cs2';
    try {
      await api.post('/teams', { name, game });
      await refreshUser();
    } catch (e) {
      alert(e?.response?.data?.error || 'failed');
    }
  };

  if (!user) return null;

  const stats = user.preferredGame === 'dota2' ? user.dota2Stats : user.cs2Stats;

  return (
    <div className="gg-page">
      {/* Profile Header */}
      <div className="gg-profile-header">
        <img
          src={user.steamAvatar || 'https://via.placeholder.com/56'}
          alt=""
          width={56}
          height={56}
          className="gg-avatar"
        />
        <div>
          <h1 className="gg-profile-name">{user.firstName}</h1>
          <div className="gg-profile-handle">@{user.username || '—'}</div>
        </div>
      </div>

      {/* Steam Warning */}
      {!user.steamId64 ? <div className="gg-alert">Connect Steam to unlock stats & tournaments</div> : null}

      {/* Steam Card */}
      <div className="gg-glass gg-glass--panel" style={{ marginTop: 16 }}>
        <div className="gg-panel-title">Steam Account</div>
        {!user.steamId64 ? (
          <>
            <input
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              placeholder="SteamID64 or vanity URL"
              className="gg-input"
            />
            <button type="button" onClick={connectSteam} className="gg-btn-inline">
              Connect Steam
            </button>
          </>
        ) : (
          <div className="gg-steam-line">
            {user.steamUsername}
            <button
              type="button"
              onClick={() => api.get('/users/me/steam/refresh').then(() => refreshUser())}
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stats Card */}
      <div className="gg-glass gg-glass--panel" style={{ marginTop: 12 }}>
        <div className="gg-panel-title">Game Stats</div>
        {user.preferredGame === 'dota2' && stats ? (
          <div className="gg-stats-line">
            <RankBadge medal={stats.rankMedal} /> MMR {stats.mmr} · WR {stats.winRate?.toFixed?.(0)}%
          </div>
        ) : null}
        {user.preferredGame === 'cs2' && stats ? (
          <div className="gg-stats-line">
            KD {stats.kdRatio?.toFixed?.(2)} · WR {stats.winRate?.toFixed?.(0)}% · Wins {stats.wins}
          </div>
        ) : null}
        {!stats ? (
          <div className="gg-muted">Connect Steam to see your stats</div>
        ) : null}
      </div>

      {/* Preferences Card */}
      <div className="gg-glass gg-glass--panel" style={{ marginTop: 12 }}>
        <div className="gg-panel-title">Preferences</div>
        <select
          value={prefs.preferredGame}
          onChange={(e) => setPrefs({ ...prefs, preferredGame: e.target.value })}
          className="gg-select"
        >
          <option value="cs2">CS2</option>
          <option value="dota2">Dota 2</option>
        </select>
        <div className="gg-field-stack">
          <input
            placeholder="Language (e.g. English, Russian)"
            value={prefs.language}
            onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
            className="gg-input"
          />
          <input
            placeholder="Active hours (e.g. 18:00–23:00)"
            value={prefs.activeHours}
            onChange={(e) => setPrefs({ ...prefs, activeHours: e.target.value })}
            className="gg-input"
          />
          <input
            placeholder="Looking for (e.g. Competitive team)"
            value={prefs.lookingFor}
            onChange={(e) => setPrefs({ ...prefs, lookingFor: e.target.value })}
            className="gg-input"
          />
        </div>
      </div>

      {/* Team Card */}
      <div className="gg-glass gg-glass--panel" style={{ marginTop: 12 }}>
        <div className="gg-panel-title">My Team</div>
        {!user.teamId ? (
          <button type="button" onClick={createTeam} className="gg-btn-inline">
            Create Team
          </button>
        ) : (
          <div className="gg-stats-line">Team #{user.teamId}</div>
        )}
      </div>
    </div>
  );
}
