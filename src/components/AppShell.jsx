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
      <main className="workspace">
        <header className="topbar">
          <motion.div
            className="brand-lockup"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHover}
          >
            <span className="brand-mark" aria-hidden="true">H</span>
            <div>
              <strong>HABBIT QUESTS</strong>
            </div>
          </motion.div>
          <nav className="top-nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={playTap}
                onMouseEnter={playHover}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        className="active-indicator"
                        layoutId="topNavIndicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            {isError && <span className="sync-status" role="status">Could not load your profile</span>}
            {!isLoading && !isError && me && (
              <>
                <motion.div
                  className="quick-stat shell-xp"
                  whileHover={{ scale: 1.05, y: -1 }}
                  onMouseEnter={playHover}
                >
                  <strong>{me.totalXp.toLocaleString()}</strong>
                  <span>XP</span>
                </motion.div>
                <motion.div
                  className="quick-stat"
                  whileHover={{ scale: 1.05, y: -1 }}
                  onMouseEnter={playHover}
                >
                  <strong>{me.level}</strong>
                  <span>{me.tier}</span>
                </motion.div>
              </>
            )}
            <div className="shell-notifications">
              <motion.button
                type="button"
                className="round-action"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  playTap();
                  setNotificationsOpen((open) => !open);
                }}
                onMouseEnter={playHover}
              >
                <Icon name="bell" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.section
                    className="notification-popover"
                    aria-label="Notifications"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  >
                    <div>
                      <strong>Notifications</strong>
                      <motion.button
                        type="button"
                        onClick={() => {
                          playTap();
                          setNotificationsOpen(false);
                        }}
                        aria-label="Close notifications"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ×
                      </motion.button>
                    </div>
                    {notifications.length === 0 ? (
                      <p>Your path is clear.</p>
                    ) : (
                      notifications.slice(0, 8).map((item) => (
                        <motion.button
                          key={item.id}
                          type="button"
                          className={item.readAt ? '' : 'unread'}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            playTap();
                            markNotificationRead.mutate(item.id);
                          }}
                        >
                          <strong>{item.title}</strong>
                          <span>{item.body}</span>
                        </motion.button>
                      ))
                    )}
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
            <motion.button
              type="button"
              className="round-action"
              aria-label="Settings"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                playTap();
                setSettingsOpen(true);
              }}
              onMouseEnter={playHover}
            >
              <Icon name="gear" />
            </motion.button>
            <motion.button
              type="button"
              className="ghost-action"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playTap();
                setLogoutDialogOpen(true);
              }}
              onMouseEnter={playHover}
            >
              Sign out
            </motion.button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <JournalTransition key={location.pathname} className="route-stage">
            <Outlet />
          </JournalTransition>
        </AnimatePresence>
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={playTap}
            onMouseEnter={playHover}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    className="active-indicator"
                    layoutId="bottomNavIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
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
