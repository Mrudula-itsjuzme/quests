import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { playTap } from '../../lib/useSoundEffects';

export function WorldHud({ me, rankProgress, energy, gold, gems, onOpenNotifications, onOpenProfile }) {
  const [statsOpen, setStatsOpen] = useState(false);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, rankProgress)));
  const profileColors = deriveProfileColors(me);

  return (
    <>
      <div className="world-hud world-hud-left">
        <button
          type="button"
          className="world-hud-avatar"
          aria-label="Open profile"
          onClick={onOpenProfile}
          style={{
            '--profile-a': profileColors[0],
            '--profile-b': profileColors[1],
            '--profile-ring': profileColors[2],
          }}
        >
          <svg viewBox="0 0 44 44" className="world-xp-ring" aria-hidden="true">
            <circle cx="22" cy="22" r={radius} className="world-xp-ring-track" />
            <motion.circle
              cx="22"
              cy="22"
              r={radius}
              className="world-xp-ring-fill"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <span className="world-hud-avatar-face">{(me?.displayName || 'S')[0].toUpperCase()}</span>
          <span className="world-hud-level">{me?.level ?? 1}</span>
        </button>
      </div>

      <div className="world-hud world-hud-right">
        <button
          type="button"
          className={`world-hud-stats-toggle ${statsOpen ? 'open' : ''}`}
          aria-expanded={statsOpen}
          aria-label="Toggle explorer stats"
          onClick={() => { playTap(); setStatsOpen((open) => !open); }}
        >
          <Icon name="coin" />
          <span><AnimatedCounter value={gold} duration={0.5} /></span>
        </button>
        <AnimatePresence>
          {statsOpen && (
            <motion.div
              className="world-hud-stats-popover"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              <div className="world-hud-pill" title="Energy">
                <Icon name="bolt" />
                <span><AnimatedCounter value={energy.value} duration={0.5} />/{energy.max}</span>
              </div>
              <div className="world-hud-pill" title="Gold">
                <Icon name="coin" />
                <span><AnimatedCounter value={gold} duration={0.5} /></span>
              </div>
              <div className="world-hud-pill" title="Gems">
                <Icon name="gem" />
                <span><AnimatedCounter value={gems} duration={0.5} /></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          className="world-hud-bell"
          aria-label="Notifications"
          onClick={() => { playTap(); onOpenNotifications(); }}
        >
          <Icon name="bell" />
        </button>
      </div>
    </>
  );
}

function deriveProfileColors(me) {
  const palettes = [
    ['#2f8f5f', '#a8e6bd', '#f3d575'],
    ['#8b5e34', '#e8c98b', '#2f7a4e'],
    ['#1f7a6d', '#b6eadb', '#f0c46b'],
    ['#9a6a2f', '#f0d9a2', '#296b48'],
    ['#3f6f39', '#cde69d', '#d8b457'],
  ];
  const seed = `${me?.displayName || 'Guest'}:${me?.level || 1}:${me?.tierLabel || me?.tier || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}
