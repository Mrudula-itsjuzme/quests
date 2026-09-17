import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '../Icon';
import { useMotionReducedPreference } from '../../lib/useMotionPreference';

export function WaxSealCeremony({ levelUp, onComplete }) {
  const button = useRef(null);
  const systemReduced = useReducedMotion();
  const calm = useMotionReducedPreference();
  const reduced = systemReduced || calm;
  useEffect(() => {
    const previous = document.activeElement;
    button.current?.focus();
    return () => previous?.focus?.();
  }, []);
  return createPortal(
    <motion.div className="modal-overlay celebration-overlay" role="dialog" aria-modal="true" aria-label="Level up"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onKeyDown={event => {
        if (event.key === 'Escape') onComplete();
        if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); }
      }}>
      <motion.div className="celebration-card level-up-card"
        initial={reduced ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.24 }}>
        <div className="celebration-emblem"><Icon name="compass" /></div>
        <p className="eyebrow">A LITTLE FURTHER INTO THE WILD</p>
        <h2>Level {levelUp.level}</h2>
        {levelUp.tier && <p>{levelUp.tier}</p>}
        {Number(levelUp.xp) > 0 && <p className="reward-badge">+{levelUp.xp} XP earned</p>}
        <button ref={button} type="button" className="primary-action continue-btn" onClick={onComplete}>Continue exploring</button>
      </motion.div>
    </motion.div>, document.body,
  );
}
