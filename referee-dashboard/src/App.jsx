import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { setAuthToken } from './api/client.js';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { ActiveTournaments } from './pages/ActiveTournaments.jsx';
import { ReviewQueue } from './pages/ReviewQueue.jsx';
import { Disputes } from './pages/Disputes.jsx';

function Shell({ children }) {
  const loc = useLocation();
  if (loc.pathname === '/login') return children;

  const linkStyle = (path) => ({
    display: 'block',
    textDecoration: 'none',
    color: loc.pathname.startsWith(path) ? '#ccff00' : '#a1a1aa',
    fontWeight: loc.pathname.startsWith(path) ? 700 : 500,
    padding: '8px 12px',
    borderRadius: '6px',
    background: loc.pathname.startsWith(path) ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '0.875rem'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid #27272a', padding: 24, background: '#0f0f11' }}>
        <div style={{ fontWeight: 800, marginBottom: 32, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GG Ops <span style={{color: '#ccff00'}}>&bull;</span></div>
        <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
        <Link to="/active" style={linkStyle('/active')}>Active</Link>
        <Link to="/review" style={linkStyle('/review')}>Review</Link>
        <Link to="/disputes" style={linkStyle('/disputes')}>Disputes</Link>
      </aside>
      <main style={{ flex: 1, padding: 32, background: '#09090b' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('ref_token');
  const loc = useLocation();
  useEffect(() => {
    setAuthToken(token || '');
  }, [token]);
  if (token && loc.pathname === '/login') return <Navigate to="/dashboard" replace />;
  if (!token && loc.pathname !== '/login') return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter basename="/referee">
      <RequireAuth>
        <Shell>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/active" element={<ActiveTournaments />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Shell>
      </RequireAuth>
    </BrowserRouter>
  );
}
