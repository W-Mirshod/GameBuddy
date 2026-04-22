import React from 'react';
import { rankColor } from '../utils/rankUtils.js';

export function RankBadge({ medal }) {
  if (!medal) return null;
  const col = rankColor(medal);
  return (
    <span
      className="gg-rbadge"
      style={{ color: col, borderColor: col, border: `1px solid ${col}` }}
    >
      {medal}
    </span>
  );
}
