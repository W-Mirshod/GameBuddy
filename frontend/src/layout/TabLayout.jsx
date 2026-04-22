import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabStyle = ({ isActive }) => ({
  flex: 1,
  textAlign: 'center',
  padding: '10px 0',
  textDecoration: 'none',
  color: isActive ? 'var(--gg-primary)' : '#888',
  fontSize: 11,
  fontWeight: isActive ? 700 : 500,
});

export function TabLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gg-bg)' }}>
      <Outlet />
      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          borderTop: '1px solid var(--gg-border)',
          background: 'var(--gg-card)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <NavLink to="/" end style={tabStyle}>
          Home
        </NavLink>
        <NavLink to="/find" style={tabStyle}>
          Find
        </NavLink>
        <NavLink to="/tournaments" style={tabStyle}>
          Tournaments
        </NavLink>
        <NavLink to="/leaderboard" style={tabStyle}>
          LB
        </NavLink>
        <NavLink to="/profile" style={tabStyle}>
          Profile
        </NavLink>
      </nav>
    </div>
  );
}
