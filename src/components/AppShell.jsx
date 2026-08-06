import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../features/auth/AuthContext';
import { useMe } from '../features/quests/queries';
import { OfflineSanctuary } from './OfflineSanctuary';
import { SettingsModal } from './SettingsModal';
import { LogoutDialog } from './LogoutDialog';
import { JournalTransition } from './motion/JournalTransition';
import { WaxSealCeremony } from './motion/WaxSealCeremony';
import { Icon } from './Icon';
import { playHover, playLevelUp, playTap } from '../lib/useSoundEffects';
import { PullToRefresh } from './motion/PullToRefresh';
import { MagneticButton } from './motion/MagneticButton';
import { WorldAmbience } from './WorldAmbience';
import { DawnMoment, useDawnMoment } from './DawnMoment';

const navItems = [
  { to: '/app', label: 'Capture', icon: 'home', end: true },
  { to: '/app/quests', label: 'Quests', icon: 'scroll' },
  { to: '/app/collection', label: 'Collection', icon: 'grid' },
  { to: '/app/community', label: 'Community', icon: 'shield' },
  { to: '/app/profile', label: 'Profile', icon: 'user' },
];

export function AppShell() {
  const location = useLocation();
  const { signOut, devMode } = useAuth();
  const { data: me, isLoading, isError } = useMe();
  const [notice, setNotice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const { visible: dawnVisible, dismiss: dismissDawn } = useDawnMoment();

  const isWorldRoute = location.pathname === '/app';

  useEffect(() => {
    const onNotice = (event) => {
      setNotice(event.detail);
      playTap();
    };
    const onLevelUp = (event) => {
      setLevelUp(event.detail);
      playLevelUp();
    };
    const onOpenSettings = () => setSettingsOpen(true);
    window.addEventListener('habbit-notice', onNotice);
    window.addEventListener('habbit-level-up', onLevelUp);
    window.addEventListener('habbit-open-settings', onOpenSettings);
    return () => {
      window.removeEventListener('habbit-notice', onNotice);
      window.removeEventListener('habbit-level-up', onLevelUp);
      window.removeEventListener('habbit-open-settings', onOpenSettings);
    };
  }, []);

  return (
    <div className="app-shell">
      <WorldAmbience />
      <OfflineSanctuary />
      {devMode && (
        <div className="dev-auth-banner" role="status">
          Development auth active — this is a local identity, not a real account.
        </div>
      )}
      <header className={`topbar ${isWorldRoute ? 'topbar-world-hidden' : ''}`}>
        <motion.div
          className="brand-lockup"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={playHover}
        >
          <span className="brand-mark" aria-hidden="true">W</span>
          <div>
            <strong>WILD REALM</strong>
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
        <div className="user-profile-trigger">
          {!isLoading && !isError && me && (
            <div className="quick-stat shell-xp">
              <strong>{me.totalXp.toLocaleString()}</strong>
              <span>XP</span>
            </div>
          )}
          <MagneticButton
            type="button"
            className="round-action"
            aria-label="Settings"
            strength={0.3}
            onClick={() => setSettingsOpen(true)}
          >
            <Icon name="gear" />
          </MagneticButton>
          <MagneticButton
            type="button"
            className="ghost-action"
            aria-label="Sign out"
            strength={0.2}
            onClick={() => setLogoutDialogOpen(true)}
          >
            Sign out
          </MagneticButton>
        </div>
      </header>

      {/* Main scrolling content area */}
      <div className={`mobile-content-area ${isWorldRoute ? 'mobile-content-area-world' : ''}`}>
        <PullToRefresh>
          <AnimatePresence mode="wait">
            <JournalTransition key={location.pathname} className="route-stage">
              <Outlet />
            </JournalTransition>
          </AnimatePresence>
        </PullToRefresh>

        {/* Floating Glass Bottom Dock — hidden on the world screen, which has its own compass nav */}
        {!isWorldRoute && (
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
          </nav>
        )}
      </div>

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
        {dawnVisible && <DawnMoment onDismiss={dismissDawn} />}
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
