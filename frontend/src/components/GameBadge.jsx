import React from 'react';

export function GameBadge({ game }) {
  const isCs2 = game === 'cs2';
  return (
    <span className={`gg-game-badge ${isCs2 ? 'gg-game-badge--cs2' : 'gg-game-badge--dota2'}`}>
      {isCs2 ? '● CS2' : '● DOTA 2'}
    </span>
  );
}
