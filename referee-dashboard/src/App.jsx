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
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>
      <aside style={{ width: 200, borderRight: '1px solid #222', padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 16 }}>GG Referee</div>
        <Link to="/dashboard" style={{ display: 'block', color: '#8af', marginBottom: 8 }}>
          Dashboard
        </Link>
        <Link to="/active" style={{ display: 'block', color: '#8af', marginBottom: 8 }}>
          Active
        </Link>
        <Link to="/review" style={{ display: 'block', color: '#8af', marginBottom: 8 }}>
          Review
        </Link>
        <Link to="/disputes" style={{ display: 'block', color: '#8af', marginBottom: 8 }}>
          Disputes
        </Link>
      </aside>
      <main style={{ flex: 1 }}>{children}</main>
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
