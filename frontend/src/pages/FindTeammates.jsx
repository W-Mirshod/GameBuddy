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

  return (
    <div style={{ padding: 12, paddingBottom: 88 }}>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Find Teammates</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {['cs2', 'dota2'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--gg-border)',
              background: game === g ? 'var(--gg-primary)' : 'var(--gg-card)',
              color: game === g ? '#000' : '#fff',
            }}
          >
            {g === 'cs2' ? 'CS2' : 'DOTA 2'}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: '#888', marginTop: 16 }}>Loading…</div> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {items.map((u) => (
          <PlayerCard key={u.id} u={u} />
        ))}
      </div>
    </div>
  );
}
