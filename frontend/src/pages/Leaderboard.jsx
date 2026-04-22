import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function Leaderboard() {
  const [game, setGame] = useState('overall');
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState({ top: [], me: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/leaderboard', { params: { game, period } });
        if (!cancel) setData(d);
      } catch (e) {
        console.log('[lb]', e?.response?.data || e?.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [game, period]);

  return (
    <div style={{ padding: 12, paddingBottom: 88 }}>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Leaderboard</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {['all', 'week', 'month'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--gg-border)',
              background: period === p ? 'var(--gg-primary)' : 'var(--gg-card)',
              color: period === p ? '#000' : '#fff',
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {['overall', 'cs2', 'dota2'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--gg-border)',
              background: game === g ? 'var(--gg-primary)' : 'var(--gg-card)',
              color: game === g ? '#000' : '#fff',
            }}
          >
            {g}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: '#888', marginTop: 12 }}>Loading…</div> : null}
      <div style={{ marginTop: 12 }}>
        {(data.top || []).map((row, i) => (
          <div
            key={row.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid var(--gg-border)',
              color: '#ccc',
            }}
          >
            <span>
              #{i + 1} {row.user?.firstName}
            </span>
            <span>{row.points} pts</span>
          </div>
        ))}
      </div>
      {data.me?.rank ? (
        <div style={{ marginTop: 16, color: 'var(--gg-primary)' }}>
          You: #{data.me.rank} — {data.me.points} pts
        </div>
      ) : null}
    </div>
  );
}
