import { Icon, categoryIcon } from '../../components/Icon';

export function DiscoveryCard({ card, imageUrl, compact = false }) {
  const rarityTier = (card.rarityTier || card.rarity || 'common').toLowerCase();

  return (
    <div className={`capture-card-reveal rarity-${rarityTier} ${compact ? 'capture-card-compact' : ''}`}>
      <span className="capture-card-shine" aria-hidden="true" />
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
