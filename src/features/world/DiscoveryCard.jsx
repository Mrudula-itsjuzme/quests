import { motion } from 'framer-motion';

export function DiscoveryCard({ card, imageUrl, onAddToLibrary, onShare, onClose }) {
  const rarityTier = (card.rarityTier || card.rarity || 'legendary').toUpperCase();
  const cardImg = imageUrl || card.imageUrl || '/assets/african-grey-parrot.png';
  const itemName = card.itemName || card.cardTitle || card.title || 'African Grey Parrot';
  const scientificName = card.scientificName || 'Psittacus erithacus';
  const confidence = card.confidence ? Math.round(card.confidence * 100) : 98;
  const xpEarned = card.xpEarned || 900;
  const locationText = card.location || 'Kakum National Park, Ghana';
  const streakDays = card.streakDays || 5;

  return (
    <div className="discovery-card-modal">
      {/* Modal Header */}
      <div className="discovery-modal-header">
        <span className="discovery-header-badge">✨ NEW DISCOVERY!</span>
        <button
          type="button"
          className="discovery-close-btn"
          onClick={onClose || onAddToLibrary}
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
      {/* Creature Photo Frame */}
      <div className="discovery-hero-frame">
        <img className="discovery-hero-img" src={cardImg} alt={itemName} />

        {/* Metallic Gold Hexagonal Emblem */}
        <div className="discovery-hex-badge">
          <span>S</span>
          <small>RANK</small>
        </div>
      </div>

      {/* Creature Title & Tags */}
      <div className="discovery-title-section">
        <h2>{itemName}</h2>
        <em>{scientificName}</em>

        <div className="discovery-element-tags">
          <span className="discovery-tag">🐾 Familiar</span>
          <span className="discovery-tag">💨 Wind/Air</span>
        </div>
      </div>

      {/* Stat Grid (4 blocks) */}
      <div className="discovery-stat-grid">
        <div className="discovery-stat-box gold">
          <small>Rarity</small>
          <strong>S Rank</strong>
        </div>
        <div className="discovery-stat-box gold">
          <small>XP Earned</small>
          <strong>+{xpEarned}</strong>
        </div>
        <div className="discovery-stat-box">
          <small>AI Match</small>
          <strong>{confidence}%</strong>
        </div>
        <div className="discovery-stat-box">
          <small>Status</small>
          <strong>Verified ✓</strong>
        </div>
      </div>

      {/* Location & Weather Strip */}
      <div className="discovery-env-strip">
        <span>📍 {locationText}</span>
        <span>🌤️ 23°C Cloudy</span>
      </div>

      {/* Action Buttons */}
      <div className="discovery-action-btns">
        <button type="button" className="discovery-btn-glass" onClick={onAddToLibrary}>
          Add to Library
        </button>
        <button type="button" className="discovery-btn-primary" onClick={onShare}>
          Share Discovery
        </button>
      </div>

      {/* Discovery Streak Banner */}
      <div className="discovery-streak-banner">
        <span>🔥 Discovery Streak: {streakDays} Days!</span>
        <strong>Next Chest in 5 days 🎁</strong>
      </div>
    </div>
  );
}

