import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useMe } from '../features/quests/queries';
import { Icon } from './Icon';

const navItems = [
  { to: '/app', label: 'Home', icon: 'home', end: true },
  { to: '/app/quests', label: 'Quests', icon: 'scroll' },
  { to: '/app/guild', label: 'Guild', icon: 'shield' },
  { to: '/app/rewards', label: 'Rewards', icon: 'chest' },
  { to: '/app/gallery', label: 'Gallery', icon: 'grid' },
  { to: '/app/profile', label: 'Profile', icon: 'user' },
];

export function AppShell() {
  const { signOut, devMode } = useAuth();
  const { data: me, isLoading, isError } = useMe();
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const onNotice = (event) => setNotice(event.detail);
    window.addEventListener('habbit-notice', onNotice);
    return () => window.removeEventListener('habbit-notice', onNotice);
  }, []);

  return (
    <div className="app-shell">
      {devMode && (
        <div className="dev-auth-banner" role="status">
          Development auth active — this is a local identity, not a real account.
        </div>
      )}
      <main className="workspace">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">H</span>
            <div>
              <strong>HABBIT QUESTS</strong>
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
                <div className="quick-stat shell-xp">
                  <strong>{me.totalXp.toLocaleString()}</strong>
                  <span>XP</span>
                </div>
                <div className="quick-stat">
                  <strong>{me.level}</strong>
                  <span>{me.tier}</span>
                </div>
              </>
            )}
            <button type="button" className="round-action" aria-label="Notifications" onClick={() => window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'No new notices. Your path is clear.' }))}><Icon name="bell" /></button>
            <button type="button" className="ghost-action" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {notice && <div className="toast-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
    </div>
  );
}
