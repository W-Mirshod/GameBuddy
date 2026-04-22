import React from 'react';
import { GameBadge } from './GameBadge.jsx';
import { formatUzt } from '../utils/formatDate.js';

export function TournamentCard({ t, onOpen }) {
  const spots = (t.maxTeams || 8) - (t.registrationCount || 0);
  return (
    <div
      className="gg-glass gg-tcard"
      onClick={() => onOpen?.(t)}
      style={{ cursor: onOpen ? 'pointer' : 'default' }}
    >
      <div className="gg-tcard-header">
        <GameBadge game={t.game} />
        <span className="gg-tcard-prize">${t.prizePool?.toFixed?.(0) || 0}</span>
      </div>
      <div className="gg-tcard-title">{t.title}</div>
      <div className="gg-tcard-date">{formatUzt(t.dateTime)}</div>
      <div className="gg-tcard-footer">
        <div className="gg-tcard-meta">Entry: ${t.entryFee}</div>
        <div className={`gg-tcard-spots ${spots > 0 ? 'gg-tcard-spots--open' : 'gg-tcard-spots--full'}`}>
          {spots > 0 ? `${spots} spots left` : 'Full'}
        </div>
      </div>
    </div>
  );
}
