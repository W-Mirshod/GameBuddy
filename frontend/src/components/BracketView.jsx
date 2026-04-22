import React from 'react';

export function BracketView({ bracketData, highlightTeamId }) {
  if (!bracketData?.rounds) {
    return <div className="gg-muted">No bracket data available</div>;
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      {bracketData.rounds.map((r) => (
        <div key={r.round} style={{ marginBottom: 20 }}>
          <div className="gg-section-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 10 }}>
            {r.name}
          </div>
          {(r.matches || []).map((m) => {
            const isHighlighted = highlightTeamId && (m.team1?.id === highlightTeamId || m.team2?.id === highlightTeamId);
            const team1Won = m.winner?.id === m.team1?.id;
            const team2Won = m.winner?.id === m.team2?.id;

            return (
              <div key={m.id} className="gg-match">
                <div className={`gg-match-team ${team1Won ? 'gg-match-team--winner' : !m.team1 ? 'gg-match-team--tbd' : team2Won ? 'gg-match-team--loser' : ''}`}>
                  {m.team1?.name || 'TBD'}
                </div>
                <div className="gg-match-divider" />
                <div className={`gg-match-team ${team2Won ? 'gg-match-team--winner' : !m.team2 ? 'gg-match-team--tbd' : team1Won ? 'gg-match-team--loser' : ''}`}>
                  {m.team2?.name || 'TBD'}
                </div>
                {isHighlighted ? (
                  <div className="gg-match-highlight">Your team</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
