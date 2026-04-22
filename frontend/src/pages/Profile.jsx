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
    <div style={{ padding: 12, paddingBottom: 88 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img src={user.steamAvatar || 'https://via.placeholder.com/56'} alt="" width={56} height={56} style={{ borderRadius: 12 }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 700 }}>{user.firstName}</div>
          <div style={{ color: '#888' }}>@{user.username || '—'}</div>
        </div>
      </div>

      {!user.steamId64 ? (
        <div style={{ marginTop: 12, padding: 10, background: 'var(--gg-card)', borderRadius: 10, color: '#ffeb3b' }}>
          Connect Steam to unlock stats →
        </div>
      ) : null}

      <div style={{ marginTop: 16, padding: 12, background: 'var(--gg-card)', borderRadius: 12, border: '1px solid var(--gg-border)' }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Steam</div>
        {!user.steamId64 ? (
          <>
            <input
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              placeholder="SteamID64 or vanity URL"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--gg-border)', background: '#111', color: '#fff' }}
            />
            <button type="button" onClick={connectSteam} style={{ marginTop: 8, padding: 8, width: '100%', fontWeight: 700 }}>
              Connect
            </button>
          </>
        ) : (
          <div style={{ color: '#aaa' }}>
            {user.steamUsername}{' '}
            <button type="button" onClick={() => api.get('/users/me/steam/refresh').then(() => refreshUser())}>
              Refresh stats
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--gg-card)', borderRadius: 12, border: '1px solid var(--gg-border)' }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Stats</div>
        {user.preferredGame === 'dota2' && stats ? (
          <div style={{ color: '#ccc' }}>
            <RankBadge medal={stats.rankMedal} /> MMR {stats.mmr} · WR {stats.winRate?.toFixed?.(0)}%
          </div>
        ) : null}
        {user.preferredGame === 'cs2' && stats ? (
          <div style={{ color: '#ccc' }}>
            KD {stats.kdRatio?.toFixed?.(2)} · WR {stats.winRate?.toFixed?.(0)}% · Wins {stats.wins}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--gg-card)', borderRadius: 12, border: '1px solid var(--gg-border)' }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Preferences</div>
        <select
          value={prefs.preferredGame}
          onChange={(e) => setPrefs({ ...prefs, preferredGame: e.target.value })}
          style={{ width: '100%', padding: 8 }}
        >
          <option value="cs2">CS2</option>
          <option value="dota2">Dota 2</option>
        </select>
        <input
          placeholder="Language"
          value={prefs.language}
          onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
          style={{ width: '100%', marginTop: 8, padding: 8 }}
        />
        <input
          placeholder="Active hours"
          value={prefs.activeHours}
          onChange={(e) => setPrefs({ ...prefs, activeHours: e.target.value })}
          style={{ width: '100%', marginTop: 8, padding: 8 }}
        />
        <input
          placeholder="Looking for"
          value={prefs.lookingFor}
          onChange={(e) => setPrefs({ ...prefs, lookingFor: e.target.value })}
          style={{ width: '100%', marginTop: 8, padding: 8 }}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--gg-card)', borderRadius: 12, border: '1px solid var(--gg-border)' }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>My Team</div>
        {!user.teamId ? (
          <button type="button" onClick={createTeam}>
            Create team
          </button>
        ) : (
          <div style={{ color: '#ccc' }}>Team #{user.teamId}</div>
        )}
      </div>
    </div>
  );
}
