import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/referee/active').then(({ data: d }) => setData(d)).catch(console.error);
  }, []);
  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h2>Overview</h2>
      <p style={{ color: '#888' }}>Flagged reviews: {data?.flaggedCount ?? '—'}</p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <Link to="/active" style={{ color: '#7ecbff' }}>
          Active tournaments
        </Link>
        <Link to="/review" style={{ color: '#7ecbff' }}>
          Review queue
        </Link>
        <Link to="/disputes" style={{ color: '#7ecbff' }}>
          Disputes
        </Link>
      </nav>
    </div>
  );
}
