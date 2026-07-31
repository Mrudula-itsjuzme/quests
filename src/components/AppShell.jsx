import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../features/auth/AuthContext';
import { useMe, useMarkNotificationRead, useNotifications } from '../features/quests/queries';
import { OfflineSanctuary } from './OfflineSanctuary';
import { SettingsModal } from './SettingsModal';
import { LogoutDialog } from './LogoutDialog';
import { JournalTransition } from './motion/JournalTransition';
import { WaxSealCeremony } from './motion/WaxSealCeremony';
import { Icon } from './Icon';
import { playHover, playLevelUp, playTap } from '../lib/useSoundEffects';
import { PullToRefresh } from './motion/PullToRefresh';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  useEffect(() => {
    const onNotice = (event) => {
      setNotice(event.detail);
      playTap();
    };
    const onLevelUp = (event) => {
      setLevelUp(event.detail);
      playLevelUp();
    };
    window.addEventListener('habbit-notice', onNotice);
    window.addEventListener('habbit-level-up', onLevelUp);
    return () => {
      window.removeEventListener('habbit-notice', onNotice);
      window.removeEventListener('habbit-level-up', onLevelUp);
    };
  }, []);

  return (
    <div className="app-shell">
      <OfflineSanctuary />
      {devMode && (
        <div className="dev-auth-banner" role="status">
          Development auth active — this is a local identity, not a real account.
        </div>
      )}
      {/* Main scrolling content area */}
      <div className="mobile-content-area" style={{ overflow: 'hidden' }}>
        <PullToRefresh>
          <AnimatePresence mode="wait">
            <JournalTransition key={location.pathname} className="route-stage">
              <Outlet />
            </JournalTransition>
          </AnimatePresence>
        </PullToRefresh>
      </div>

      {/* Floating Glass Bottom Dock */}
      <nav className="mobile-bottom-dock" aria-label="Primary Navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
            onClick={playTap}
            onMouseEnter={playHover}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    className="dock-active-bg"
                    layoutId="dockIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon name={item.icon} />
              </>
            )}
          </NavLink>
        ))}
        {/* Settings / Profile Trigger on Dock */}
        <button
          type="button"
          className="dock-item"
          onClick={() => { playTap(); setSettingsOpen(true); }}
          aria-label="Settings"
        >
          <Icon name="gear" />
        </button>
      </nav>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast-notice"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => {
                playTap();
                setNotice('');
              }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {levelUp && (
          <WaxSealCeremony levelUp={levelUp} onComplete={() => setLevelUp(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            user={me}
            onClose={() => setSettingsOpen(false)}
            onLogout={() => {
              setSettingsOpen(false);
              setLogoutDialogOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logoutDialogOpen && (
          <LogoutDialog
            onConfirm={() => {
              setLogoutDialogOpen(false);
              signOut();
            }}
            onCancel={() => setLogoutDialogOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
