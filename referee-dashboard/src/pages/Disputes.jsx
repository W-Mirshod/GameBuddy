import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function Disputes() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/referee/disputes').then(({ data }) => setRows(data)).catch(console.error);
  }, []);
  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h2>Disputes</h2>
      {rows.map((r) => (
        <div key={r.id} style={{ padding: 12, border: '1px solid #333', marginBottom: 8 }}>
          <div>#{r.id}</div>
          <div style={{ color: '#888' }}>{r.status}</div>
          <img src={r.screenshotUrl} alt="" style={{ maxWidth: 200, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
