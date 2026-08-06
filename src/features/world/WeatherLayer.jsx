import { useMemo } from 'react';
import { motion } from 'framer-motion';

const CONDITIONS = ['clear', 'clear', 'clear', 'fog', 'rain'];

export function pickWeather() {
  return CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
}

export function WeatherLayer({ condition, phase }) {
  const raindrops = useMemo(() => Array.from({ length: 26 }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 1.4,
    duration: 0.6 + Math.random() * 0.4,
  })), []);

  const fireflies = useMemo(() => Array.from({ length: 10 }, (_, index) => ({
    id: index,
    left: 8 + Math.random() * 84,
    top: 30 + Math.random() * 45,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 3,
  })), []);

  const dust = useMemo(() => Array.from({ length: 8 }, (_, index) => ({
    id: index,
    left: 5 + Math.random() * 90,
    top: 20 + Math.random() * 55,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 4,
  })), []);

  return (
    <div className="world-weather-layer" aria-hidden="true">
      {condition === 'rain' && (
        <div className="world-rain">
          {raindrops.map((drop) => (
            <motion.span
              key={drop.id}
              className="world-raindrop"
              style={{ left: `${drop.left}%` }}
              animate={{ y: ['-10%', '110%'], opacity: [0, 0.6, 0] }}
              transition={{ duration: drop.duration, repeat: Infinity, delay: drop.delay, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      {condition === 'fog' && (
        <>
          <motion.div
            className="world-fog-bank world-fog-bank-1"
            animate={{ x: ['-10%', '10%', '-10%'] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="world-fog-bank world-fog-bank-2"
            animate={{ x: ['8%', '-8%', '8%'] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {phase === 'night' && (
        <div className="world-fireflies">
          {fireflies.map((fly) => (
            <motion.span
              key={fly.id}
              className="world-firefly"
              style={{ left: `${fly.left}%`, top: `${fly.top}%` }}
              animate={{
                x: [0, 10, -6, 0],
                y: [0, -14, 6, 0],
                opacity: [0.15, 1, 0.3, 0.15],
              }}
              transition={{ duration: fly.duration, repeat: Infinity, delay: fly.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {phase !== 'night' && condition === 'clear' && (
        <div className="world-dust">
          {dust.map((mote) => (
            <motion.span
              key={mote.id}
              className="world-dust-mote"
              style={{ left: `${mote.left}%`, top: `${mote.top}%` }}
              animate={{ y: [0, -18, 0], opacity: [0.2, 0.55, 0.2] }}
              transition={{ duration: mote.duration, repeat: Infinity, delay: mote.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
