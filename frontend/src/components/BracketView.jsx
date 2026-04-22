import React from 'react';

export function BracketView({ bracketData, highlightTeamId }) {
  if (!bracketData?.rounds) return <div style={{ color: '#888' }}>No bracket</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      {bracketData.rounds.map((r) => (
        <div key={r.round} style={{ marginBottom: 16 }}>
          <div style={{ color: 'var(--gg-primary)', fontWeight: 700, marginBottom: 8 }}>{r.name}</div>
          {(r.matches || []).map((m) => (
            <div
              key={m.id}
              style={{
                padding: 8,
                marginBottom: 6,
                borderRadius: 8,
                background: '#111',
                border: '1px solid var(--gg-border)',
              }}
            >
              <div style={{ color: m.winner?.id === m.team1?.id ? 'var(--gg-success)' : '#fff' }}>
                {m.team1?.name || 'TBD'}
              </div>
              <div style={{ color: '#666', textAlign: 'center' }}>vs</div>
              <div style={{ color: m.winner?.id === m.team2?.id ? 'var(--gg-success)' : '#fff' }}>
                {m.team2?.name || 'TBD'}
              </div>
              {highlightTeamId && (m.team1?.id === highlightTeamId || m.team2?.id === highlightTeamId) ? (
                <div style={{ color: 'var(--gg-primary)', fontSize: 11, marginTop: 4 }}>Your team</div>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
