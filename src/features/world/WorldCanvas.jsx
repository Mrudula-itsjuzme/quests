import { motion } from 'framer-motion';
import { ParallaxLayer } from '../../components/motion/ParallaxLayer';
import { AmbientIdle } from '../../components/motion/AmbientIdle';
import { Icon } from '../../components/Icon';
import { PlayerAvatar } from './PlayerAvatar';
import { WeatherLayer } from './WeatherLayer';
import { playTap } from '../../lib/useSoundEffects';

export const WORLD_BUILDINGS = [
  { id: 'quest-board', label: 'Quest Board', icon: 'scroll', to: '/app/quests', x: 22, y: 40 },
  { id: 'guild-hall', label: 'Guild Hall', icon: 'shield', to: '/app/community', x: 76, y: 32 },
  { id: 'marketplace', label: 'Marketplace', icon: 'chest', to: '/app/rewards', x: 14, y: 66 },
  { id: 'library', label: 'Library', icon: 'book', to: '/app/collection', x: 85, y: 62 },
  { id: 'sanctuary', label: 'Sanctuary', icon: 'home', to: '/app/profile', x: 30, y: 82 },
  { id: 'watchtower', label: 'Watchtower', icon: 'compass', to: '/app/community', x: 55, y: 20 },
];

export function WorldCanvas({ phase, weather, avatarInitial, avatarTitle, onEnterBuilding }) {
  return (
    <div className={`world-canvas world-phase-${phase}`}>
      <div className="world-sky" aria-hidden="true">
        <motion.div
          className="world-cloud world-cloud-1"
          animate={{ x: ['-10%', '120%'] }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="world-cloud world-cloud-2"
          animate={{ x: ['-20%', '130%'] }}
          transition={{ duration: 130, repeat: Infinity, ease: 'linear', delay: 12 }}
        />
        {phase === 'night' && <div className="world-stars" />}
        {(phase === 'dawn' || phase === 'dusk') && <div className="world-aurora" />}
      </div>

      <ParallaxLayer className="world-parallax-far" depth={6}>
        <div className="world-hills world-hills-far" aria-hidden="true" />
      </ParallaxLayer>

      <ParallaxLayer className="world-parallax-mid" depth={12}>
        <div className="world-hills world-hills-near" aria-hidden="true" />

        <div className="world-ground">
          {WORLD_BUILDINGS.map((building) => (
            <AmbientIdle
              key={building.id}
              className="world-building-slot"
              style={{ left: `${building.x}%`, top: `${building.y}%` }}
              amplitude={3}
              duration={4.5 + (building.x % 3)}
            >
              <motion.button
                type="button"
                className="world-building"
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  playTap();
                  onEnterBuilding(building);
                }}
                aria-label={building.label}
              >
                <span className="world-building-glow" aria-hidden="true" />
                <span className="world-building-icon">
                  <Icon name={building.icon} />
                </span>
                <span className="world-building-label">{building.label}</span>
              </motion.button>
            </AmbientIdle>
          ))}

          <PlayerAvatar initial={avatarInitial} title={avatarTitle} />
        </div>
      </ParallaxLayer>

      <WeatherLayer condition={weather} phase={phase} />
    </div>
  );
}
