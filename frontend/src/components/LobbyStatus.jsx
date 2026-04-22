import React from 'react';

export function LobbyStatus({ checkedIn, maxTeams }) {
  return (
    <div style={{ color: '#aaa', fontSize: 13 }}>
      Check-in: <span style={{ color: '#fff' }}>{checkedIn}</span> / {maxTeams || 8} teams
    </div>
  );
}
