import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useMe } from '../features/quests/queries';
import { useMarkNotificationRead, useNotifications } from '../features/quests/queries';
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
  const location = useLocation();
  const { signOut, devMode } = useAuth();
  const { data: me, isLoading, isError } = useMe();
  const notificationsQuery = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const [notice, setNotice] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  useEffect(() => {
    const onNotice = (event) => setNotice(event.detail);
    const onLevelUp = (event) => setLevelUp(event.detail);
    window.addEventListener('habbit-notice', onNotice);
    window.addEventListener('habbit-level-up', onLevelUp);
    return () => {
      window.removeEventListener('habbit-notice', onNotice);
      window.removeEventListener('habbit-level-up', onLevelUp);
    };
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
            <div className="shell-notifications">
              <button type="button" className="round-action" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" />{unreadCount > 0 && <span>{unreadCount}</span>}</button>
              {notificationsOpen && <section className="notification-popover" aria-label="Notifications"><div><strong>Notifications</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button></div>{notifications.length === 0 ? <p>Your path is clear.</p> : notifications.slice(0, 8).map((item) => <button key={item.id} type="button" className={item.readAt ? '' : 'unread'} onClick={() => markNotificationRead.mutate(item.id)}><strong>{item.title}</strong><span>{item.body}</span></button>)}</section>}
            </div>
            <button type="button" className="ghost-action" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <div className="route-stage" key={location.pathname}>
          <Outlet />
        </div>
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
      {levelUp && <div className="level-up-celebration" role="dialog" aria-modal="true" aria-label="Level up"><div className="level-up-rays" /><section><span className="eyebrow">Path advanced</span><Icon name="compass" /><h2>Level {levelUp.level}</h2><p>{levelUp.tier} · +{levelUp.xp} XP</p><button type="button" className="primary-action" onClick={() => setLevelUp(null)}>Continue the journey</button></section></div>}
    </div>
  );
}
