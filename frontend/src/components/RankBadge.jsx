import React from 'react';
import { rankColor } from '../utils/rankUtils.js';

export function RankBadge({ medal }) {
  if (!medal) return null;
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        color: rankColor(medal),
        border: `1px solid ${rankColor(medal)}`,
      }}
    >
      {medal}
    </span>
  );
}
