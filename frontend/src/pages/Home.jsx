import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { TournamentCard } from '../components/TournamentCard.jsx';
import { GameBadge } from '../components/GameBadge.jsx';

export function Home() {
  const [filter, setFilter] = useState('all');
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [winners, setWinners] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const game = filter === 'all' ? undefined : filter;
        const [l, u, w, lb] = await Promise.all([
          api.get('/tournaments', { params: { status: 'active', game } }),
          api.get('/tournaments', { params: { status: 'open', game } }),
          api.get('/tournaments/recent-winners'),
          api.get('/leaderboard', { params: { game: 'overall', period: 'week' } }),
        ]);
        if (!cancel) {
          setLive(l.data);
          setUpcoming(u.data);
          setWinners(w.data);
          setTop(lb.data.top || []);
        }
      } catch (e) {
        console.log('[home]', e?.response?.data || e?.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [filter]);

  return (
    <div style={{ padding: 12, paddingBottom: 88 }}>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>GG Arena</div>
      <div style={{ color: '#888', marginTop: 4 }}>CS2 & Dota 2 Tournaments</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {['cs2', 'dota2', 'all'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--gg-border)',
              background: filter === g ? 'var(--gg-primary)' : 'var(--gg-card)',
              color: filter === g ? '#000' : '#fff',
            }}
          >
            {g === 'all' ? 'All' : g === 'cs2' ? 'CS2' : 'DOTA 2'}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: '#888', marginTop: 16 }}>Loading…</div> : null}

      <section style={{ marginTop: 20 }}>
        <div style={{ color: 'var(--gg-success)', fontWeight: 700, marginBottom: 8 }}>● Live Now</div>
        {!live.length ? (
          <div style={{ color: '#666' }}>No live tournaments</div>
        ) : (
          live.map((t) => <TournamentCard key={t.id} t={t} />)
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Upcoming</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {upcoming.map((t) => (
            <TournamentCard key={t.id} t={t} />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Recent Winners</div>
        {!winners.length ? (
          <div style={{ color: '#666' }}>None yet</div>
        ) : (
          winners.map((r) => (
            <div key={r.id} style={{ color: '#ccc', marginBottom: 6 }}>
              <GameBadge game={r.tournament.game} /> {r.team?.name} — {r.tournament?.title}
            </div>
          ))
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Top This Week</div>
        {top.slice(0, 5).map((row, i) => (
          <div key={row.id} style={{ color: '#aaa', fontSize: 13 }}>
            #{i + 1} {row.user?.firstName} — {row.points} pts
          </div>
        ))}
      </section>
    </div>
  );
}
