import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springConfig } from './motion/MotionVariants';
import { playTap } from '../lib/useSoundEffects';

const STORAGE_KEY = 'habbit-dawn-moment-seen';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return 'The world woke before you did.';
  if (hour >= 12 && hour < 17) return 'The day is already in motion.';
  if (hour >= 17 && hour < 21) return 'The light is turning gold.';
  return 'The quiet hours favor the determined.';
}

export function useDawnMoment() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen !== todayKey()) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, todayKey());
    setVisible(false);
  };

  return { visible, dismiss };
}

export function DawnMoment({ onDismiss }) {
  const flavorText = greetingForHour(new Date().getHours());

  const handleDismiss = () => {
    playTap();
    onDismiss();
  };

  return (
    <motion.div
      className="dawn-moment-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Today's moment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleDismiss}
    >
      <motion.div
        className="dawn-moment-card"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={springConfig.cinematic}
      >
        <span className="dawn-moment-mark" aria-hidden="true">✦</span>
        <p>{flavorText}</p>
        <button type="button" className="dawn-moment-continue" onClick={handleDismiss}>
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
