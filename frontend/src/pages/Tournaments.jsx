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

  return (
    <div style={{ padding: 12, paddingBottom: 88 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['upcoming', 'live', 'my'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--gg-border)',
              background: tab === t ? 'var(--gg-primary)' : 'var(--gg-card)',
              color: tab === t ? '#000' : '#fff',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? <div style={{ color: '#888', marginTop: 12 }}>Loading…</div> : null}
      {!detail ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'my' ? (
            (user?.registrations || []).length ? (
              user.registrations.map((r) => (
                <div
                  key={r.id}
                  onClick={() => r.tournament && openDetail(r.tournament)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: 'var(--gg-card)',
                    border: '1px solid var(--gg-border)',
                    color: '#ccc',
                  }}
                >
                  <div style={{ color: '#fff', fontWeight: 600 }}>{r.tournament?.title}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Payment: {r.paymentStatus}</div>
                </div>
              ))
            ) : (
              <div style={{ color: '#666' }}>No registrations</div>
            )
          ) : (
            list.map((t) => <TournamentCard key={t.id} t={t} onOpen={openDetail} />)
          )}
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={() => setDetail(null)} style={{ color: 'var(--gg-primary)' }}>
            ← Back
          </button>
          <div style={{ color: '#fff', fontWeight: 700, marginTop: 8 }}>{detail.title}</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{formatUzt(detail.dateTime)}</div>
          {split ? (
            <div style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>
              Prize pool ${detail.prizePool?.toFixed(0)} — 1st ${split.first.toFixed(0)} / 2nd ${split.second.toFixed(0)} / 3rd{' '}
              {split.third.toFixed(0)}
            </div>
          ) : null}
          {user?.ownedTeam?.game === detail.game ? (
            <button
              type="button"
              onClick={register}
              style={{
                marginTop: 12,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--gg-primary)',
                fontWeight: 700,
              }}
            >
              Register team
            </button>
          ) : (
            <div style={{ color: '#888', marginTop: 12 }}>Create a matching team (captain) to register.</div>
          )}
          {bracket ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Bracket</div>
              <BracketView bracketData={bracket} highlightTeamId={user?.teamId} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
