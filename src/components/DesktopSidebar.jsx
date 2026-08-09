import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { playHover, playTap } from '../lib/useSoundEffects';
import { useAuth } from '../features/auth/AuthContext';
import { useMe } from '../features/quests/queries';

const navItems = [
  { to: '/app', label: 'Map', icon: 'compass', end: true },
  { to: '/app/quests', label: 'Quests', icon: 'scroll' },
  { to: '/app/collection', label: 'Collection', icon: 'book' },
  { to: '/app/community', label: 'Community', icon: 'shield' },
];

export function DesktopSidebar({ onOpenSettings, onLogout }) {
  const { data: me, isLoading, isError } = useMe();
  const { devMode } = useAuth();

  const handleOpenCapture = () => {
    playTap();
    window.dispatchEvent(new CustomEvent('wild-realm-open-capture'));
  };

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <motion.div
          className="brand-lockup"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={playHover}
        >
          <span className="brand-mark" aria-hidden="true">🌿</span>
          <div>
            <strong>WILD REALM</strong>
          </div>
        </motion.div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary Navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={playTap}
            onMouseEnter={playHover}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-shutter-container">
          <motion.button
            type="button"
            className="sidebar-shutter-btn"
            aria-label="Open Camera Capture"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCapture}
          >
            <Icon name="camera" />
            <span>Capture</span>
          </motion.button>
        </div>
      </nav>

      <div className="sidebar-footer">
        {!isLoading && !isError && me && (
          <div className="sidebar-user-info">
            <div className="user-xp-badge">
              <strong>{me.totalXp.toLocaleString()}</strong>
              <span>XP</span>
            </div>
            <div className="user-profile-meta">
              <span>Level {Math.floor(me.totalXp / 1000) + 1}</span>
            </div>
          </div>
        )}
        
        <div className="sidebar-actions">
          <button type="button" className="sidebar-action-btn" onClick={onOpenSettings}>
            <Icon name="gear" /> Settings
          </button>
          <button type="button" className="sidebar-action-btn" onClick={onLogout}>
            <Icon name="log-out" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
