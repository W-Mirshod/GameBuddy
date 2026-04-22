function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateBracket(teams) {
  const shuffled = shuffleInPlace([...teams]);
  if (shuffled.length !== 8) throw new Error('bracket_requires_8_teams');

  return {
    rounds: [
      {
        round: 1,
        name: 'Quarter Finals',
        matches: [
          { id: 'm1', team1: shuffled[0], team2: shuffled[1], winner: null },
          { id: 'm2', team1: shuffled[2], team2: shuffled[3], winner: null },
          { id: 'm3', team1: shuffled[4], team2: shuffled[5], winner: null },
          { id: 'm4', team1: shuffled[6], team2: shuffled[7], winner: null },
        ],
      },
      {
        round: 2,
        name: 'Semi Finals',
        matches: [
          { id: 'm5', team1: null, team2: null, winner: null, feedsFrom: ['m1', 'm2'] },
          { id: 'm6', team1: null, team2: null, winner: null, feedsFrom: ['m3', 'm4'] },
        ],
      },
      {
        round: 3,
        name: 'Grand Final',
        matches: [{ id: 'm7', team1: null, team2: null, winner: null, feedsFrom: ['m5', 'm6'] }],
      },
    ],
  };
}

function findMatch(bracketData, matchId) {
  for (const round of bracketData.rounds || []) {
    for (const match of round.matches || []) {
      if (match.id === matchId) return match;
    }
  }
  return null;
}

export function advanceBracket(bracketData, matchId, winnerTeam) {
  const match = findMatch(bracketData, matchId);
  if (!match) throw new Error('match_not_found');
  match.winner = winnerTeam;

  for (const round of bracketData.rounds || []) {
    for (const next of round.matches || []) {
      if (!next.feedsFrom || !next.feedsFrom.includes(matchId)) continue;
      const idx = next.feedsFrom.indexOf(matchId);
      if (idx === 0) next.team1 = winnerTeam;
      if (idx === 1) next.team2 = winnerTeam;
    }
  }

  return bracketData;
}

