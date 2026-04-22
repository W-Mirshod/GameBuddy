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

  const filters = [
    { key: 'cs2', label: 'CS2' },
    { key: 'dota2', label: 'DOTA 2' },
    { key: 'all', label: 'All Games' },
  ];

  return (
    <div className="gg-page">
      {/* Hero */}
      <div className="gg-page-header">
        <h1 className="gg-hero">GG Arena</h1>
        <p className="gg-hero-sub">Competitive CS2 & Dota 2 Tournaments</p>
      </div>

      {/* Game Filter */}
      <div className="gg-segment-row">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`gg-segment${filter === key ? ' gg-segment--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="gg-loading">Loading tournaments…</div> : null}

      {/* Live Now */}
      <section className="gg-section">
        <div className="gg-section-title gg-section-title--live">
          <span className="gg-live-dot" aria-hidden />
          Live Now
        </div>
        {!live.length ? (
          <div className="gg-muted">No live tournaments right now</div>
        ) : (
          <div className="gg-vstack">
            {live.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="gg-section">
        <div className="gg-section-title">Upcoming</div>
        {upcoming.length === 0 ? (
          <div className="gg-muted">No upcoming tournaments</div>
        ) : (
          <div className="gg-scroll-x">
            {upcoming.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Winners */}
      <section className="gg-section">
        <div className="gg-section-title">Recent Winners</div>
        {!winners.length ? (
          <div className="gg-muted">No winners yet — be the first!</div>
        ) : (
          <div className="gg-vstack">
            {winners.map((r) => (
              <div key={r.id} className="gg-winner-row">
                <span className="gg-winner-icon">🏆</span>
                <div className="gg-winner-info">
                  <strong>{r.team?.name}</strong> — {r.tournament?.title}
                </div>
                <GameBadge game={r.tournament.game} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top This Week */}
      <section className="gg-section">
        <div className="gg-section-title">Top This Week</div>
        {top.length === 0 ? (
          <div className="gg-muted">No rankings yet</div>
        ) : (
          <div className="gg-vstack">
            {top.slice(0, 5).map((row, i) => (
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
        )}
      </section>
    </div>
  );
}
