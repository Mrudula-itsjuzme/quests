import { motion } from 'framer-motion';

export function AmbientIdle({ children, className = '', amplitude = 4, duration = 6, glow = false, ...props }) {
  return (
    <motion.div
      className={`ambient-idle ${glow ? 'ambient-idle-glow' : ''} ${className}`}
      animate={{
        y: [0, -amplitude, 0],
        ...(glow ? { opacity: [0.85, 1, 0.85] } : {}),
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
