import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { TournamentCard } from '../components/TournamentCard.jsx';
import { BracketView } from '../components/BracketView.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { prizeSplit } from '../utils/prizeCalc.js';
import { formatUzt } from '../utils/formatDate.js';

export function Tournaments() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const status = tab === 'live' ? 'active' : tab === 'upcoming' ? 'open' : undefined;
      const { data } = await api.get('/tournaments', { params: status ? { status } : {} });
      setList(data);
    } catch (e) {
      console.log('[tournaments]', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'my') {
      setList([]);
      setLoading(false);
      return undefined;
    }
    load();
    return undefined;
  }, [tab]);

  const openDetail = async (t) => {
    try {
      const [{ data: d }, { data: b }] = await Promise.all([
        api.get(`/tournaments/${t.id}`),
        api.get(`/tournaments/${t.id}/bracket`),
      ]);
      setDetail(d);
      setBracket(b);
    } catch (e) {
      console.log(e?.response?.data || e?.message);
    }
  };

  const register = async () => {
    if (!detail) return;
    try {
      await api.post(`/tournaments/${detail.id}/register`);
      await load();
      await refreshUser();
      alert('Registered. Check bot for Payme instructions.');
    } catch (e) {
      alert(e?.response?.data?.error || 'register failed');
    }
  };

  const split = detail ? prizeSplit(detail.prizePool) : null;

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live' },
    { key: 'my', label: 'My Tourneys' },
  ];

  return (
    <div className="gg-page">
      {/* Tab Filter */}
      <div className="gg-segment-row">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setDetail(null); }}
            className={`gg-segment${tab === key ? ' gg-segment--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="gg-loading">Loading tournaments…</div> : null}

      {/* Tournament List */}
      {!detail ? (
        <div className="gg-stack">
          {tab === 'my' ? (
            (user?.registrations || []).length ? (
              user.registrations.map((r) => (
                <div
                  key={r.id}
                  className="gg-glass gg-regcard"
                  onClick={() => r.tournament && openDetail(r.tournament)}
                  style={{ cursor: r.tournament ? 'pointer' : 'default' }}
                >
                  <div className="gg-regcard-title">{r.tournament?.title}</div>
                  <div className="gg-regcard-status">
                    Payment: <span>{r.paymentStatus}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="gg-hint">No tournament registrations yet</div>
            )
          ) : (
            list.length === 0 && !loading ? (
              <div className="gg-muted">No {tab} tournaments</div>
            ) : (
              list.map((t) => <TournamentCard key={t.id} t={t} onOpen={openDetail} />)
            )
          )}
        </div>
      ) : (
        /* Tournament Detail */
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={() => setDetail(null)} className="gg-back-link">
            ← Back to list
          </button>

          <h1 className="gg-title-lg">{detail.title}</h1>
          <div className="gg-detail-meta">{formatUzt(detail.dateTime)}</div>

          {/* Prize Pool */}
          {split ? (
            <div className="gg-detail-prize">
              <div className="gg-prize-header">Prize Pool ${detail.prizePool?.toFixed(0)}</div>
              <div className="gg-prize-grid">
                <div className="gg-prize-item">
                  <div className="gg-prize-place" style={{ color: 'var(--gg-primary)' }}>1st Place</div>
                  <div className="gg-prize-amount">${split.first.toFixed(0)}</div>
                </div>
                <div className="gg-prize-item">
                  <div className="gg-prize-place" style={{ color: 'var(--gg-text-secondary)' }}>2nd Place</div>
                  <div className="gg-prize-amount">${split.second.toFixed(0)}</div>
                </div>
                <div className="gg-prize-item">
                  <div className="gg-prize-place" style={{ color: 'var(--gg-text-dim)' }}>3rd Place</div>
                  <div className="gg-prize-amount">${split.third.toFixed(0)}</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Register Button */}
          {user?.ownedTeam?.game === detail.game ? (
            <button type="button" onClick={register} className="gg-btn-primary">
              Register Team
            </button>
          ) : (
            <div className="gg-hint">Create a matching team (captain) to register.</div>
          )}

          {/* Bracket */}
          {bracket ? (
            <div style={{ marginTop: 32 }}>
              <div className="gg-section-title">Tournament Bracket</div>
              <BracketView bracketData={bracket} highlightTeamId={user?.teamId} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
