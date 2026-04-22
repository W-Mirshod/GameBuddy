import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/find', label: 'Find', icon: '🔍' },
  { to: '/tournaments', label: 'Tourneys', icon: '⚔️' },
  { to: '/leaderboard', label: 'Ranks', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function TabLayout() {
  return (
    <div className="gg-shell">
      <Outlet />
      <nav className="gg-glass gg-glass--nav">
        {tabs.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `gg-tab${isActive ? ' gg-tab--active' : ''}`}
          >
            <span className="gg-tab-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
