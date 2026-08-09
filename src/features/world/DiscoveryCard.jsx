import { motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';

const BURST_TIERS = new Set(['epic', 'legendary']);
const BURST_PARTICLES = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return { id: index, x: Math.cos(angle) * 60, y: Math.sin(angle) * 60 };
});

export function DiscoveryCard({ card, imageUrl, compact = false }) {
  const rarityTier = (card.rarityTier || card.rarity || 'common').toLowerCase();
  const showBurst = !compact && BURST_TIERS.has(rarityTier);

  return (
    <div className={`capture-card-reveal rarity-${rarityTier} ${compact ? 'capture-card-compact' : ''}`}>
      <span className="capture-card-shine" aria-hidden="true" />
      {showBurst && (
        <span className="capture-card-burst" aria-hidden="true">
          {BURST_PARTICLES.map((particle) => (
            <motion.span
              key={particle.id}
              className="capture-card-spark"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </span>
      )}
      <span className="capture-card-rarity">{card.rarityTier || card.rarity}</span>
      {imageUrl ? (
        <span className="capture-card-image" style={{ backgroundImage: `url(${imageUrl})` }} aria-hidden="true" />
      ) : (
        <span className="capture-card-icon"><Icon name={categoryIcon(card.category)} /></span>
      )}
      <span className="capture-card-item">{card.itemName || card.title}</span>
      {!compact && card.description && <p className="capture-card-desc">{card.description}</p>}
      {card.status === 'provisional' && (
        <span className="capture-card-pending">Pending human verification</span>
      )}
    </div>
  );
}
