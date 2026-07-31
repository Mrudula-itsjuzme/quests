import { motion } from 'framer-motion';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { springConfig } from './MotionVariants';

export function AnimatedButton({
  children,
  onClick,
  className = '',
  disabled = false,
  isLoading = false,
  isSuccess = false,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'ghost'
  ...props
}) {
  return (
    <motion.button
      type={type}
      className={`animated-btn ${variant}-action ${isLoading ? 'loading' : ''} ${isSuccess ? 'success' : ''} ${className}`}
      disabled={disabled || isLoading}
      onClick={(e) => {
        playTap();
        if (onClick) onClick(e);
      }}
      onMouseEnter={playHover}
      whileHover={disabled || isLoading ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.96, y: 0 }}
      transition={springConfig.tactile}
      {...props}
    >
      <motion.span
        className="btn-content"
        animate={{ opacity: isLoading || isSuccess ? 0.2 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.span>
      {isLoading && (
        <motion.span
          className="btn-spinner"
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{
            rotate: { repeat: Infinity, duration: 0.8, ease: 'linear' },
            opacity: { duration: 0.2 },
          }}
        />
      )}
      {isSuccess && (
        <motion.span
          className="btn-checkmark"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springConfig.snappy}
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}
