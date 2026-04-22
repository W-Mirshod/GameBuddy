import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client.js';
import { io } from 'socket.io-client';

export function ReviewQueue() {
  const [rows, setRows] = useState([]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const token = localStorage.getItem('ref_token') || '';

  const load = useCallback(() => {
    api
      .get('/referee/results/flagged')
      .then(({ data }) => setRows(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_BASE_URL || '', {
      auth: { token },
    });
    socket.emit('join_referee_room');
    socket.on('referee:new_flag', load);
    const onKey = (e) => {
      const cur = rowsRef.current;
      if (!cur[0]) return;
      const id = cur[0].id;
      if (e.key === 'c') api.post(`/referee/results/${id}/confirm`).then(load);
      if (e.key === 'r') {
        const note = prompt('Reject note?');
        if (note) api.post(`/referee/results/${id}/reject`, { note }).then(load);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      socket.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  }, [token, load]);

  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h2>Review queue</h2>
      <p style={{ color: '#888' }}>Shortcuts: C confirm, R reject (first item)</p>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <img src={r.screenshotUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
          <div>
            <div>Confidence: {(r.aiConfidence * 100).toFixed(0)}%</div>
            <pre style={{ background: '#111', padding: 8, borderRadius: 8, overflow: 'auto' }}>
              {JSON.stringify(r.extractedData, null, 2)}
            </pre>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => api.post(`/referee/results/${r.id}/confirm`).then(load)}>
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  const note = prompt('Note?');
                  if (note) api.post(`/referee/results/${r.id}/reject`, { note }).then(load);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
