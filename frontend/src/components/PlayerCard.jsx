import React from 'react';
import { GameBadge } from './GameBadge.jsx';
import { RankBadge } from './RankBadge.jsx';

export function PlayerCard({ u }) {
  const stats = u.preferredGame === 'dota2' ? u.dota2Stats : u.cs2Stats;
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: 'var(--gg-card)',
        border: '1px solid var(--gg-border)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <img src={u.steamAvatar || 'https://via.placeholder.com/48'} alt="" width={48} height={48} style={{ borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>@{u.username || 'user'}</div>
        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {u.preferredGame ? <GameBadge game={u.preferredGame} /> : null}
          {u.preferredGame === 'dota2' && stats?.rankMedal ? <RankBadge medal={stats.rankMedal} /> : null}
        </div>
        {u.preferredGame === 'cs2' && stats ? (
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
            KD {stats.kdRatio?.toFixed?.(2)} · WR {stats.winRate?.toFixed?.(0)}%
          </div>
        ) : null}
        {u.preferredGame === 'dota2' && stats ? (
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
            MMR {stats.mmr} · WR {stats.winRate?.toFixed?.(0)}%
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {u.username ? (
          <a href={`https://t.me/${u.username}`} style={{ color: 'var(--gg-primary)', fontSize: 12 }}>
            Message
          </a>
        ) : null}
      </div>
    </div>
  );
}
