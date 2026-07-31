import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { springConfig } from './MotionVariants';
import { playHover } from '../../lib/useSoundEffects';

export function PhysicalCard({ children, className = '', maxTilt = 8, onClick, ...props }) {
  const cardRef = useRef(null);
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springRotateX = useSpring(rotateX, springConfig.soft);
  const springRotateY = useSpring(rotateY, springConfig.soft);

  const handleMouseMove = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const percentX = (mouseX / width) * 100;
    const percentY = (mouseY / height) * 100;

    const tiltY = ((mouseX - width / 2) / (width / 2)) * maxTilt;
    const tiltX = -((mouseY - height / 2) / (height / 2)) * maxTilt;

    rotateX.set(tiltX);
    rotateY.set(tiltY);
    setLightPos({ x: Math.round(percentX), y: Math.round(percentY) });
  };

  const handleMouseEnter = () => {
    playHover();
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setLightPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`physical-card ${className}`}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98, y: -1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      <div
        className="card-light-overlay"
        style={{
          background: `radial-gradient(600px circle at ${lightPos.x}% ${lightPos.y}%, rgba(212, 163, 89, 0.12), transparent 40%)`,
        }}
        aria-hidden="true"
      />
      <div className="card-content">{children}</div>
    </motion.div>
  );
}
