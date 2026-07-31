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
        animate={{ opacity: isLoading || isSuccess ? 0.15 : 1 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.span>
      {isLoading && (
        <motion.span
          className="btn-ring-spinner"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={springConfig.soft}
        >
          <svg className="btn-svg-ring" viewBox="0 0 32 32">
            <circle
              className="btn-ring-bg"
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.2"
            />
            <circle
              className="btn-ring-arc"
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="75.4"
              strokeLinecap="round"
            />
          </svg>
        </motion.span>
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
