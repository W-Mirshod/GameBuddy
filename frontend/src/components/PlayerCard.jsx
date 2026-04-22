import React from 'react';
import { GameBadge } from './GameBadge.jsx';
import { RankBadge } from './RankBadge.jsx';

export function PlayerCard({ u }) {
  const stats = u.preferredGame === 'dota2' ? u.dota2Stats : u.cs2Stats;
  return (
    <div className="gg-glass gg-playercard">
      <img
        src={u.steamAvatar || 'https://via.placeholder.com/48'}
        alt=""
        width={48}
        height={48}
        className="gg-avatar"
      />
      <div className="gg-playercard-info">
        <div className="gg-playercard-name">@{u.username || 'user'}</div>
        <div className="gg-playercard-badges">
          {u.preferredGame ? <GameBadge game={u.preferredGame} /> : null}
          {u.preferredGame === 'dota2' && stats?.rankMedal ? <RankBadge medal={stats.rankMedal} /> : null}
        </div>
        {u.preferredGame === 'cs2' && stats ? (
          <div className="gg-playercard-stats">
            KD <span>{stats.kdRatio?.toFixed?.(2)}</span> &bull; WR <span>{stats.winRate?.toFixed?.(0)}%</span>
          </div>
        ) : null}
        {u.preferredGame === 'dota2' && stats ? (
          <div className="gg-playercard-stats">
            MMR <span>{stats.mmr}</span> &bull; WR <span>{stats.winRate?.toFixed?.(0)}%</span>
          </div>
        ) : null}
      </div>
      <div className="gg-playercard-action">
        {u.username ? (
          <a
            href={`https://t.me/${u.username}`}
            className="gg-btn-inline"
            style={{ textDecoration: 'none', padding: '8px 14px', marginTop: 0, width: 'auto' }}
          >
            Message
          </a>
        ) : null}
      </div>
    </div>
  );
}
