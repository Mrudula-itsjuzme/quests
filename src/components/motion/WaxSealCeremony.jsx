import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Icon } from '../Icon';
import { playLevelUp, playTap } from '../../lib/useSoundEffects';
import { springConfig } from './MotionVariants';

export function WaxSealCeremony({ levelUp, onComplete }) {
  const [isSealed, setIsSealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    let interval;
    if (progress > 0 && progress < 100 && !isSealed) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            handleSeal();
            return 100;
          }
          return p + 4;
        });
      }, 50);
    } else if (progress === 0 && !isSealed) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [progress, isSealed]);

  const handlePointerDown = () => {
    if (!isSealed) {
      setProgress(5);
      controls.start({ scale: 0.95, transition: { duration: 0.2 } });
    }
  };

  const handlePointerUp = () => {
    if (!isSealed) {
      setProgress(0);
      controls.start({ scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  const handleSeal = () => {
    setIsSealed(true);
    playLevelUp();
    // Simulate heavy screen shake and stamp impact
    controls.start({
      y: [0, 15, -10, 5, 0],
      scale: [0.95, 1.05, 1],
      transition: { duration: 0.5, ease: 'easeOut' }
    });
  };

  return (
    <motion.div
      className="modal-overlay celebration-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Level Up Ceremony"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <div className="wax-seal-container">
        <AnimatePresence>
          {!isSealed && (
            <motion.div
              key="instructions"
              className="wax-instructions"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.5 }}
            >
              <h2>Path Advanced</h2>
              <p>Press and hold to seal your progress.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="wax-stamp-area"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          animate={controls}
        >
          {/* SVG Gooey Filter for melting wax effect */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="gooey" />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </svg>

          <div className="molten-wax-pool">
            <motion.div
              className="wax-spill"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1 + (progress / 200), opacity: 0.8 + (progress / 500) }}
              transition={{ ease: 'linear', duration: 0.1 }}
            />
          </div>

          <motion.div
            className={`signet-ring ${isSealed ? 'sealed' : ''}`}
            initial={{ y: -100, rotateX: 45, opacity: 0 }}
            animate={{
              y: isSealed ? 0 : -20 + (progress / 10),
              rotateX: isSealed ? 0 : 45 - (progress / 2),
              opacity: 1
            }}
            transition={isSealed ? springConfig.cinematic : { ease: 'linear', duration: 0.1 }}
          >
            <div className="signet-face">
              <Icon name="compass" />
            </div>
          </motion.div>

          <AnimatePresence>
            {!isSealed && (
              <motion.svg className="progress-ring" width="160" height="160" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
                <circle
                  cx="80" cy="80" r="74" fill="none"
                  stroke="var(--quest-gold-bright)" strokeWidth="4"
                  strokeDasharray="465"
                  strokeDashoffset={465 - (progress / 100) * 465}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isSealed && (
            <motion.div
              key="sealed-content"
              className="sealed-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, ...springConfig.cinematic }}
            >
              <h2 className="level-title">Level {levelUp.level}</h2>
              <p className="level-tier">{levelUp.tier}</p>
              <p className="level-xp">+{levelUp.xp} XP</p>
              <motion.button
                type="button"
                className="primary-action continue-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playTap();
                  onComplete();
                }}
              >
                Continue the journey
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
