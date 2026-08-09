import { motion } from 'framer-motion';
import { ParallaxLayer } from '../../components/motion/ParallaxLayer';
import { AmbientIdle } from '../../components/motion/AmbientIdle';
import { Icon } from '../../components/Icon';
import { PlayerAvatar } from './PlayerAvatar';
import { WeatherLayer } from './WeatherLayer';
import { playTap } from '../../lib/useSoundEffects';

export const WORLD_BUILDINGS = [
  { id: 'quest-board', label: 'Quest Board', icon: 'scroll', to: '/app/quests', x: 22, y: 40, scale: 1 },
  { id: 'guild-hall', label: 'Guild Hall', icon: 'shield', to: '/app/community', x: 76, y: 32, scale: 1.1 },
  { id: 'marketplace', label: 'Marketplace', icon: 'chest', to: '/app/rewards', x: 14, y: 66, scale: 1 },
  { id: 'library', label: 'Library', icon: 'book', to: '/app/collection', x: 85, y: 62, scale: 1.15 },
  { id: 'sanctuary', label: 'Sanctuary', icon: 'home', to: '/app/profile', x: 30, y: 82, scale: 1.2 },
  { id: 'watchtower', label: 'Watchtower', icon: 'compass', to: '/app/community', x: 55, y: 20, scale: 0.9 },
];

const FOLIAGE = [
  { id: 'f1', left: 4, scale: 1.1, kind: 'pine' },
  { id: 'f2', left: 12, scale: 0.8, kind: 'broadleaf' },
  { id: 'f3', left: 34, scale: 0.9, kind: 'pine' },
  { id: 'f4', left: 47, scale: 0.7, kind: 'broadleaf' },
  { id: 'f5', left: 64, scale: 1, kind: 'pine' },
  { id: 'f6', left: 79, scale: 0.85, kind: 'broadleaf' },
  { id: 'f7', left: 92, scale: 1.05, kind: 'pine' },
];

function PineSilhouette() {
  return (
    <path d="M18 2 L34 30 L26 30 L36 46 L4 46 L14 30 L6 30 Z M15 46 L21 46 L21 58 L15 58 Z" />
  );
}

function BroadleafSilhouette() {
  return (
    <>
      <circle cx="18" cy="20" r="17" />
      <circle cx="7" cy="30" r="11" />
      <circle cx="29" cy="30" r="11" />
      <path d="M15 40 L21 40 L21 58 L15 58 Z" />
    </>
  );
}

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

      <ParallaxLayer className="world-parallax-far" depth={5}>
        <svg
          className="world-ridge world-ridge-far"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,340 L60,260 L140,360 L230,220 L320,320 L410,180 L520,310 L620,210 L720,330 L830,240 L930,350 L1040,230 L1140,340 L1260,210 L1360,320 L1440,270 L1440,400 L0,400 Z" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer className="world-parallax-mid" depth={11}>
        <svg
          className="world-ridge world-ridge-near"
          viewBox="0 0 1440 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,260 L90,160 L200,270 L300,130 L400,240 L520,110 L640,230 L760,150 L880,260 L1000,170 L1120,280 L1240,180 L1360,250 L1440,190 L1440,300 L0,300 Z" />
        </svg>

        <div className="world-foliage-band" aria-hidden="true">
          {FOLIAGE.map((tree) => (
            <svg
              key={tree.id}
              className={`world-tree world-tree-${tree.kind}`}
              style={{ left: `${tree.left}%`, transform: `scale(${tree.scale})` }}
              viewBox="0 0 40 60"
            >
              {tree.kind === 'pine' ? <PineSilhouette /> : <BroadleafSilhouette />}
            </svg>
          ))}
        </div>

        <div className="world-ground">
          {WORLD_BUILDINGS.map((building) => (
            <AmbientIdle
              key={building.id}
              className="world-building-slot"
              style={{ left: `${building.x}%`, top: `${building.y}%`, '--building-scale': building.scale }}
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
                <span className="world-building-shadow" aria-hidden="true" />
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
