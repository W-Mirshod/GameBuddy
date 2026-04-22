import React from 'react';
import { GameBadge } from './GameBadge.jsx';
import { formatUzt } from '../utils/formatDate.js';

export function TournamentCard({ t, onOpen }) {
  const spots = (t.maxTeams || 8) - (t.registrationCount || 0);
  return (
    <div
      onClick={() => onOpen?.(t)}
      style={{
        minWidth: 220,
        padding: 12,
        borderRadius: 12,
        background: 'var(--gg-card)',
        border: '1px solid var(--gg-border)',
        cursor: onOpen ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <GameBadge game={t.game} />
        <span style={{ color: 'var(--gg-primary)', fontWeight: 700 }}>${t.prizePool?.toFixed?.(0) || 0}</span>
      </div>
      <div style={{ color: '#fff', fontWeight: 700, marginTop: 8 }}>{t.title}</div>
      <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>{formatUzt(t.dateTime)}</div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Entry ${t.entryFee} · {spots} spots</div>
    </div>
  );
}
