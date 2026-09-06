import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { playHover, playTap, SOUND_MUTED_KEY } from '../lib/useSoundEffects';
import { isMotionReduced, setMotionReduced } from '../lib/useMotionPreference';

export function SettingsModal({ onClose, user, onLogout, themeMode = 'light', onThemeChange }) {
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_MUTED_KEY) !== 'true');
  const [motionIntensity, setMotionIntensity] = useState(() => isMotionReduced() ? 'reduced' : 'full');
  const isGuest = user?.id?.startsWith?.('guest-') || user?.email === 'guest@wildrealm.local';

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_MUTED_KEY, next ? 'false' : 'true');
    if (next) playTap();
  };

  const setMotion = (mode) => {
    playTap();
    setMotionIntensity(mode);
    setMotionReduced(mode === 'reduced');
  };

  const setTheme = (mode) => {
    playTap();
    onThemeChange?.(mode);
  };

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="settings-modal ornate-panel"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      >
        <div className="settings-header">
          <div>
            <p className="eyebrow">APP PREFERENCES</p>
            <h2>Settings</h2>
          </div>
          <button type="button" className="detail-close" onClick={() => { playTap(); onClose(); }} aria-label="Close settings">×</button>
        </div>

        <div className="settings-section">
          <h3><Icon name="sun" /> Appearance</h3>
          <div className="setting-options compact">
            {[
              ['light', 'Day', 'Warm readable palette'],
              ['dark', 'Night', 'Higher contrast panels'],
              ['system', 'Auto', 'Match device setting'],
            ].map(([mode, label, description]) => (
              <button
                key={mode}
                type="button"
                className={`option-btn ${themeMode === mode ? 'active' : ''}`}
                onClick={() => setTheme(mode)}
                onMouseEnter={playHover}
              >
                <span>{label}</span>
                <small>{description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3><Icon name="volume-2" /> Sound</h3>
          <div className="setting-row">
            <div>
              <strong>Feedback sounds</strong>
              <p>Play subtle cues when capturing, switching tabs, and claiming rewards</p>
            </div>
            <button
              type="button"
              className={`toggle-switch ${soundEnabled ? 'active' : ''}`}
              onClick={toggleSound}
              aria-label="Toggle tactile sound effects"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3><Icon name="sparkles" /> Motion</h3>
          <div className="setting-options">
            <button
              type="button"
              className={`option-btn ${motionIntensity === 'full' ? 'active' : ''}`}
              onClick={() => setMotion('full')}
              onMouseEnter={playHover}
            >
              <span>Full Motion</span>
              <small>Responsive transitions and capture feedback</small>
            </button>
            <button
              type="button"
              className={`option-btn ${motionIntensity === 'reduced' ? 'active' : ''}`}
              onClick={() => setMotion('reduced')}
              onMouseEnter={playHover}
            >
              <span>Calm Motion</span>
              <small>Reduced movement for quieter use</small>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3><Icon name="user" /> Account</h3>
          <div className="setting-row">
            <div>
              <strong>{user?.displayName || user?.email || 'Wayfarer'}</strong>
              <p>{isGuest ? 'Guest mode saves on this device' : 'Signed-in Wild Realm account'}</p>
            </div>
            {onLogout && (
              <button
                type="button"
                className="logout-btn"
                onClick={() => { playTap(); onClose(); onLogout(); }}
                onMouseEnter={playHover}
              >
                Sign Out
              </button>
            )}
          </div>
          <div className="setting-meta-grid" aria-label="Session details">
            <span><strong>{isGuest ? 'Local' : 'Cloud'}</strong><small>Storage</small></span>
            <span><strong>{user?.tierLabel || user?.rankTitle || 'Explorer'}</strong><small>Rank</small></span>
          </div>
        </div>

        <div className="settings-footer">
          <p>Wild Realm v1.4.0</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
