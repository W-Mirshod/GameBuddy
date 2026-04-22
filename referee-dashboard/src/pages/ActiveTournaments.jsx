import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function ActiveTournaments() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api
      .get('/referee/active')
      .then(({ data }) => setRows(data.tournaments || []))
      .catch(console.error);
  }, []);
  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h2>Active</h2>
      {rows.map((t) => (
        <div key={t.id} style={{ padding: 12, border: '1px solid #333', marginBottom: 8, borderRadius: 8 }}>
          <strong>{t.title}</strong> — {t.game} — {t.status}
          <div style={{ color: '#888', fontSize: 13 }}>
            Rooms pending: {t.roomsPending} · Checked in: {t.checkedInTeams}
          </div>
        </div>
      ))}
    </div>
  );
}
