import { useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export function HoldButton({ onComplete, disabled, children, className }) {
  const fillControls = useAnimation();
  const holdTimeout = useRef(null);
  
  const HOLD_DURATION = 1500; // 1.5 seconds

  const startHold = () => {
    if (disabled) return;
    
    // Start the visual fill
    fillControls.start({
      width: '100%',
      transition: { duration: HOLD_DURATION / 1000, ease: 'linear' }
    });

    holdTimeout.current = setTimeout(() => {
      // Completed hold
      fillControls.stop();
      fillControls.set({ width: 0 });
      onComplete();
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (disabled) return;
    clearTimeout(holdTimeout.current);
    
    // Snap visual fill back
    fillControls.start({
      width: 0,
      transition: { type: 'spring', stiffness: 500, damping: 30 }
    });
  };

  return (
    <motion.button
      className={`hold-button ${className || ''}`}
      type="button"
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
    >
      <motion.div
        animate={fillControls}
        initial={{ width: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.2)',
          zIndex: 0
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}
