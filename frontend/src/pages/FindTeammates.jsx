import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { PlayerCard } from '../components/PlayerCard.jsx';

export function FindTeammates() {
  const [game, setGame] = useState('cs2');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/search', { params: { game, pageSize: 20 } });
        if (!cancel) setItems(data.items || []);
      } catch (e) {
        console.log('[find]', e?.response?.data || e?.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [game]);

  const games = [
    { key: 'cs2', label: 'CS2' },
    { key: 'dota2', label: 'Dota 2' },
  ];

  return (
    <div className="gg-page">
      <h1 className="gg-page-title">Find Teammates</h1>

      <div className="gg-segment-row">
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

      {loading ? <div className="gg-loading">Searching players…</div> : null}

      <div className="gg-vstack" style={{ marginTop: 8 }}>
        {items.length === 0 && !loading ? (
          <div className="gg-muted">No players found for this game</div>
        ) : null}
        {items.map((u) => (
          <PlayerCard key={u.id} u={u} />
        ))}
      </div>
    </div>
  );
}
