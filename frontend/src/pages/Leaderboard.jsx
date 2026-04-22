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

  const periods = [
    { key: 'all', label: 'All Time' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const games = [
    { key: 'overall', label: 'Overall' },
    { key: 'cs2', label: 'CS2' },
    { key: 'dota2', label: 'Dota 2' },
  ];

  return (
    <div className="gg-page">
      <h1 className="gg-page-title">Leaderboard</h1>

      {/* Period Filter */}
      <div className="gg-segment-row">
        {periods.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`gg-segment${period === key ? ' gg-segment--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Game Filter */}
      <div className="gg-segment-row" style={{ marginTop: 0 }}>
        {games.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setGame(key)}
            className={`gg-segment${game === key ? ' gg-segment--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="gg-loading">Loading rankings…</div> : null}

      {/* Rankings List */}
      <div className="gg-vstack" style={{ marginTop: 8 }}>
        {(data.top || []).length === 0 && !loading ? (
          <div className="gg-muted">No rankings for this period</div>
        ) : null}
        {(data.top || []).map((row, i) => (
          <div key={row.id} className="gg-lb-row">
            {i < 3 ? (
              <span className={`gg-rank-badge gg-rank-${i + 1}`}>{i + 1}</span>
            ) : (
              <span className="gg-lb-rank">#{i + 1}</span>
            )}
            <span className="gg-lb-name">{row.user?.firstName}</span>
            <span className="gg-lb-points">{row.points} pts</span>
          </div>
        ))}
      </div>

      {/* My Rank */}
      {data.me?.rank ? (
        <div className="gg-me-rank">
          Your Rank: #{data.me.rank} — {data.me.points} pts
        </div>
      ) : null}
    </div>
  );
}
