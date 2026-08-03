import { useMemo } from 'react';
import { motion } from 'framer-motion';

function timeOfDayPhase(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

const PHASE_GLOW = {
  dawn: 'radial-gradient(circle at 50% -10%, rgba(212, 163, 106, 0.16), transparent 60%)',
  day: 'radial-gradient(circle at 50% -10%, rgba(212, 180, 132, 0.08), transparent 55%)',
  dusk: 'radial-gradient(circle at 50% -10%, rgba(180, 96, 66, 0.14), transparent 60%)',
  night: 'radial-gradient(circle at 50% -10%, rgba(80, 90, 140, 0.08), transparent 65%)',
};

export function WorldAmbience() {
  const phase = useMemo(() => timeOfDayPhase(new Date().getHours()), []);

  return (
    <motion.div
      className={`world-ambience world-ambience-${phase}`}
      style={{ background: PHASE_GLOW[phase] }}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    />
  );
}
