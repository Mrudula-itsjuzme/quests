import { motion } from 'framer-motion';

export function DiscoveryCard({ card, imageUrl, onAddToLibrary, onShare, onClose }) {
  const cardData = card || {};
  const itemName = cardData.itemName || cardData.cardTitle || cardData.title || 'African Grey Parrot';
  const scientificName = cardData.scientificName || 'Psittacus erithacus';
  const cardImg = imageUrl || cardData.imageUrl || '/assets/african-grey-parrot.png';
  const xpEarned = cardData.xpEarned || 900;
  const confidence = cardData.confidence ? Math.round(cardData.confidence * 100) : 98;
  const locationText = cardData.location || 'Kakum National Park, Ghana, Africa';
  const streakDays = cardData.streakDays || 5;

  return (
    <div className="discovery-card-modal">
      {/* Top Navigation Bar */}
      <div className="discovery-modal-header">
        <button
          type="button"
          className="discovery-close-btn"
          onClick={onClose || onAddToLibrary}
          aria-label="Close modal"
        >
          ✕
        </button>
        <span className="discovery-header-badge">✨ NEW DISCOVERY!</span>
        <button
          type="button"
          className="discovery-share-top-btn"
          onClick={onShare}
          aria-label="Share discovery"
        >
          📤
        </button>
      </div>

      {/* Hero Image Frame with Gold Hex Badge */}
      <div className="discovery-hero-frame">
        <img className="discovery-hero-img" src={cardImg} alt={itemName} />
        
        {/* Pagination Dots */}
        <div className="discovery-hero-dots">
          <span></span><span></span><span className="active"></span><span></span><span></span>
        </div>
      </div>

      {/* Creature Title, Elements & Gold Hex Rarity Badge */}
      <div className="discovery-title-row">
        <div className="discovery-title-info">
          <h2>{itemName}</h2>
          <em>{scientificName}</em>
          <div className="discovery-element-tags">
            <span className="discovery-tag">🐾 Familiar</span>
            <span className="discovery-tag">💨 Wind</span>
          </div>
        </div>

        {/* Metallic Gold Hexagon Badge */}
        <div className="discovery-hex-badge-wrap">
          <div className="discovery-hex-badge">
            <span>$</span>
          </div>
          <small>LEGENDARY</small>
        </div>
      </div>

      {/* 4-Column Stat Grid */}
      <div className="discovery-stat-grid">
        <div className="discovery-stat-box gold">
          <small>RARITY</small>
          <strong>S Rank</strong>
          <span className="stat-sub font-gold">(LEGENDARY)</span>
        </div>
        <div className="discovery-stat-box gold">
          <small>XP EARNED</small>
          <strong>+{xpEarned} XP</strong>
        </div>
        <div className="discovery-stat-box">
          <small>AI CONFIDENCE</small>
          <strong>{confidence}%</strong>
        </div>
        <div className="discovery-stat-box verified">
          <small>VERIFIED</small>
          <strong className="chip-verified">✔ Human Verified</strong>
        </div>
      </div>

      {/* Description Text */}
      <p className="discovery-description">
        Highly intelligent and social parrots native to the rainforests of West and Central Africa. Known for their remarkable mimicry and problem solving abilities.
      </p>

      {/* Metadata Strip (Location, Date/Time, Weather) */}
      <div className="discovery-env-strip-row">
        <div className="env-box">
          <small>LOCATION</small>
          <span>📍 {locationText}</span>
        </div>
        <div className="env-box">
          <small>DATE & TIME</small>
          <span>📅 12 May 2025 07:42 AM</span>
        </div>
        <div className="env-box">
          <small>WEATHER</small>
          <span>☁️ 23°C Cloudy</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="discovery-action-btns">
        <button type="button" className="discovery-btn-glass" onClick={onAddToLibrary}>
          📖 ADD TO LIBRARY
        </button>
        <button type="button" className="discovery-btn-primary" onClick={onShare}>
          🔗 SHARE
        </button>
      </div>

      {/* Discovery Streak Banner */}
      <div className="discovery-streak-banner">
        <div className="streak-info">
          <span className="streak-icon">🎁</span>
          <div>
            <strong>Discovery Streak: {streakDays} Days 🔥</strong>
            <p>Keep it up! Next chest at 10 days.</p>
          </div>
        </div>
        <span className="chest-badge-icon">📦</span>
      </div>
    </div>
  );
}


