import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playTap } from '../../lib/useSoundEffects';
import { springConfig } from '../../components/motion/MotionVariants';

const ITEMS = [
  { id: 'journal', label: 'Journal', icon: 'book', to: '/app/profile' },
  { id: 'inventory', label: 'Inventory', icon: 'grid', to: '/app/collection' },
  { id: 'guild', label: 'Guild', icon: 'shield', to: '/app/community' },
  { id: 'shop', label: 'Shop', icon: 'chest', to: '/app/rewards' },
  { id: 'achievements', label: 'Achievements', icon: 'star', to: '/app/profile' },
];

const RADIUS = 118;

export function RadialMenu({ open, onClose, onNavigate, onOpenSettings }) {
  if (!open) return null;

  const arcStart = -170;
  const arcEnd = -10;
  const step = ITEMS.length > 1 ? (arcEnd - arcStart) / (ITEMS.length - 1) : 0;

  return (
    <>
      <motion.button
        type="button"
        className="world-radial-backdrop"
        aria-label="Close menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div className="world-radial-menu" role="menu">
        {ITEMS.map((item, index) => {
          const angleDeg = arcStart + step * index;
          const angle = (angleDeg * Math.PI) / 180;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          return (
            <motion.button
              key={item.id}
              type="button"
              className="world-radial-item"
              role="menuitem"
              aria-label={item.label}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{ x, y, opacity: 1, scale: 1 }}
              exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              transition={{ ...springConfig.tactile, delay: index * 0.03 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                playTap();
                onNavigate(item.to);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          className="world-radial-item world-radial-settings"
          role="menuitem"
          aria-label="Settings"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: Math.cos((-90 * Math.PI) / 180) * (RADIUS + 64), y: Math.sin((-90 * Math.PI) / 180) * (RADIUS + 64), opacity: 1, scale: 1 }}
          exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          transition={{ ...springConfig.tactile, delay: ITEMS.length * 0.03 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            playTap();
            onOpenSettings();
          }}
        >
          <Icon name="gear" />
          <span>Settings</span>
        </motion.button>
      </div>
    </>
  );
}
