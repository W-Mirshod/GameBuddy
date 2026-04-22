import React from 'react';

export function GameBadge({ game }) {
  const isCs2 = game === 'cs2';
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        background: isCs2 ? 'var(--gg-cs2)' : 'var(--gg-dota2)',
        color: '#fff',
      }}
    >
      {isCs2 ? 'CS2' : 'DOTA 2'}
    </span>
  );
}
