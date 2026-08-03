import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { springConfig } from './MotionVariants';

export function ParallaxLayer({ children, className = '', depth = 16, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springConfig.soft);
  const springY = useSpring(y, springConfig.soft);
  const translateX = useTransform(springX, (value) => value * depth);
  const translateY = useTransform(springY, (value) => value * depth);

  const handleMouseMove = (event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const percentX = (event.clientX - rect.left) / rect.width - 0.5;
    const percentY = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(percentX);
    y.set(percentY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      className={`parallax-layer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <motion.div style={{ x: translateX, y: translateY }}>{children}</motion.div>
    </div>
  );
}
