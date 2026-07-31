import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { springConfig } from './MotionVariants';
import { playHover, playTap } from '../../lib/useSoundEffects';

export function MagneticButton({ children, className = '', onClick, disabled = false, strength = 0.2, ...props }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springConfig.tactile);
  const springY = useSpring(y, springConfig.tactile);

  const handleMouseMove = (event) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (event.clientX - centerX) * strength;
    const distanceY = (event.clientY - centerY) * strength;
    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleClick = (event) => {
    if (disabled) return;
    playTap();
    if (onClick) onClick(event);
  };

  return (
    <motion.button
      ref={ref}
      className={`magnetic-button ${className} ${isHovered ? 'hovered' : ''}`}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96, y: 1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      <span className="magnetic-button-content">{children}</span>
      <span className="magnetic-button-glow" aria-hidden="true" />
    </motion.button>
  );
}
