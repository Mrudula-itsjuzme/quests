import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useMe } from '../features/quests/queries';
import { Icon } from './Icon';

const themeStorageKey = 'quests.theme.v1';
const navItems = [
  { to: '/app', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/app/quests', label: 'Quests', icon: 'check' },
  { to: '/app/gallery', label: 'Gallery', icon: 'bookmark' },
  { to: '/app/profile', label: 'Profile', icon: 'shield' },
];

export function AppShell() {
  const { signOut, devMode } = useAuth();
  const { data: me, isLoading, isError } = useMe();
  const [theme, setTheme] = useState(() => window.localStorage.getItem(themeStorageKey) || 'dark');

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const shellClassName = `app-shell ${theme === 'light' ? 'light-theme' : 'dark-theme'}`;

  return (
    <div className={shellClassName}>
      {devMode && (
        <div className="dev-auth-banner" role="status">
          Development auth active — this is a local identity, not a real account.
        </div>
      )}
      <main className="workspace">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">Q</span>
            <div>
              <strong>QUESTS</strong>
            </div>
          </div>
          <nav className="top-nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            {isError && <span className="sync-status" role="status">Could not load your profile</span>}
            {!isLoading && !isError && me && (
              <>
                <div className="quick-stat">
                  <strong>{me.totalXp.toLocaleString()}</strong>
                  <span>XP</span>
                </div>
                <div className="quick-stat">
                  <strong>{me.level}</strong>
                  <span>{me.tier}</span>
                </div>
              </>
            )}
            <button type="button" className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button type="button" className="ghost-action" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
