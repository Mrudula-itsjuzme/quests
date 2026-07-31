import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { playHover, playTap } from '../lib/useSoundEffects';

export function LogoutDialog({ onConfirm, onCancel }) {
  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Sign Out"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        className="logout-dialog ornate-panel"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      >
        <div className="logout-emblem">
          <Icon name="compass" />
        </div>
        <h2>Close Your Journal?</h2>
        <p>Your path, streak, and unlocked achievements are safely sealed. Return anytime to resume your journey.</p>

        <div className="logout-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => { playTap(); onCancel(); }}
            onMouseEnter={playHover}
          >
            Stay in Journal
          </button>
          <button
            type="button"
            className="primary-btn seal-btn"
            onClick={() => { playTap(); onConfirm(); }}
            onMouseEnter={playHover}
          >
            Seal & Sign Out
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
