import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TabLayout } from './layout/TabLayout.jsx';
import { Home } from './pages/Home.jsx';
import { FindTeammates } from './pages/FindTeammates.jsx';
import { Tournaments } from './pages/Tournaments.jsx';
import { Leaderboard } from './pages/Leaderboard.jsx';
import { Profile } from './pages/Profile.jsx';

function Gate() {
  const { loading, error } = useAuth();
  if (loading) {
    return <div style={{ padding: 24, color: '#888' }}>Loading…</div>;
  }
  if (error === 'open_in_telegram') {
    return (
      <div style={{ padding: 24, color: '#fff' }}>
        Open this app inside Telegram as a Mini App to sign in.
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<FindTeammates />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppRoot appearance="dark">
      <BrowserRouter>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </BrowserRouter>
    </AppRoot>
  );
}
