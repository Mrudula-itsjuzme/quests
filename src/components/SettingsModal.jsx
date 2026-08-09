import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { playHover, playTap, SOUND_MUTED_KEY } from '../lib/useSoundEffects';
import { isMotionReduced, setMotionReduced } from '../lib/useMotionPreference';

export function SettingsModal({ onClose, user, onLogout }) {
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_MUTED_KEY) !== 'true');
  const [motionIntensity, setMotionIntensity] = useState(() => isMotionReduced() ? 'reduced' : 'full');

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

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sanctuary Settings"
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
            <p className="eyebrow">SANCTUARY PREFERENCES</p>
            <h2>Journal Settings</h2>
          </div>
          <button type="button" className="detail-close" onClick={() => { playTap(); onClose(); }} aria-label="Close settings">×</button>
        </div>

        <div className="settings-section">
          <h3><Icon name="volume-2" /> Sound Atmosphere</h3>
          <div className="setting-row">
            <div>
              <strong>Tactile Haptics & Chimes</strong>
              <p>Play subtle audio cues when turning pages and claiming rewards</p>
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
          <h3><Icon name="sparkles" /> Motion & Fluidity</h3>
          <div className="setting-options">
            <button
              type="button"
              className={`option-btn ${motionIntensity === 'full' ? 'active' : ''}`}
              onClick={() => setMotion('full')}
              onMouseEnter={playHover}
            >
              <span>Full Motion</span>
              <small>3D book physics & 60fps sweeps</small>
            </button>
            <button
              type="button"
              className={`option-btn ${motionIntensity === 'reduced' ? 'active' : ''}`}
              onClick={() => setMotion('reduced')}
              onMouseEnter={playHover}
            >
              <span>Calm Motion</span>
              <small>Gentle dissolves & static focus</small>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3><Icon name="user" /> Wayfarer Session</h3>
          <div className="setting-row">
            <div>
              <strong>{user?.displayName || user?.email || 'Wayfarer'}</strong>
              <p>Active journal session</p>
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
        </div>

        <div className="settings-footer">
          <p>HABBIT Journal Edition v1.4.0 — Crafting Mindful Progress</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
