import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

function useCountUp(targetValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!targetValue) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easeOutQuad * targetValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}

export function DiscoveryCard({ card, imageUrl, onAddToLibrary, onShare, onClose, layoutIdPrefix = '' }) {
  const cardData = card || {};
  const itemName = cardData.itemName || cardData.cardTitle || cardData.title || 'Discovered Creature';
  const scientificName = cardData.scientificName || cardData.category || 'Fauna Wild';
  const cardImg = imageUrl || cardData.imageUrl || '/assets/african-grey-parrot.png';
  const rawXp = cardData.xpAwarded ?? cardData.xpEarned ?? cardData.xp ?? 0;
  const animatedXp = useCountUp(rawXp, 1000);
  const confidence = cardData.confidence != null ? Math.round(cardData.confidence * 100) : null;
  const locationText = cardData.location || (cardData.gps ? `${cardData.gps.lat?.toFixed(2)}°, ${cardData.gps.lng?.toFixed(2)}°` : 'Wild Sanctuary');
  const rarityTier = (cardData.rarityTier || cardData.rarity || 'A').toUpperCase();
  const elementCategory = cardData.element || cardData.category || 'Familiars';
  const capturedAtDate = cardData.capturedAt ? new Date(cardData.capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const cardId = cardData.assetId || cardData.id || 'new';

  // 3D Tilt interaction logic
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 20 });
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      layoutId={layoutIdPrefix ? `${layoutIdPrefix}card-${cardId}` : undefined}
      className={`discovery-card-modal rank-${rarityTier.toLowerCase()}`}
      ref={cardRef}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.4}
      onDragEnd={(e, info) => {
        if (info.offset.y > 100) {
          (onClose || onAddToLibrary)();
        }
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        touchAction: 'none' // Better for drag physics
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
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

      {/* Hero Image Frame with Holographic Overlay */}
      <motion.div layoutId={layoutIdPrefix ? `${layoutIdPrefix}img-${cardId}` : undefined} className="discovery-hero-frame">
        <img className="discovery-hero-img" src={cardImg} alt={itemName} />
        
        {/* Dynamic Holographic Glare Layer */}
        {(rarityTier === 'S' || rarityTier === 'A') && (
          <motion.div
            className="discovery-holo-glare"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.35) 0%, rgba(245,158,11,0.15) 40%, transparent 80%)`,
            }}
          />
        )}
      </motion.div>

      {/* Creature Title, Elements & Gold Hex Rarity Badge */}
      <div className="discovery-title-row">
        <div className="discovery-title-info">
          <h2>{itemName}</h2>
          <em>{scientificName}</em>
          <div className="discovery-element-tags">
            <span className="discovery-tag">🐾 {elementCategory}</span>
            <span className="discovery-tag">🌿 Wild</span>
          </div>
        </div>

        {/* Rarity Hexagon Badge */}
        <div className="discovery-hex-badge-wrap">
          <div className={`discovery-hex-badge rank-hex-${rarityTier.toLowerCase()}`}>
            <span>{rarityTier}</span>
          </div>
          <small>{rarityTier === 'S' ? 'LEGENDARY' : rarityTier === 'A' ? 'EPIC' : rarityTier === 'B' ? 'RARE' : 'COMMON'}</small>
        </div>
      </div>

      {/* 4-Column Stat Grid */}
      <div className="discovery-stat-grid">
        <div className={`discovery-stat-box ${rarityTier === 'S' ? 'gold' : ''}`}>
          <small>RARITY</small>
          <strong>{rarityTier} Rank</strong>
          <span className="stat-sub font-gold">
            ({rarityTier === 'S' ? 'LEGENDARY' : rarityTier === 'A' ? 'EPIC' : 'RARE'})
          </span>
        </div>
        <div className="discovery-stat-box gold">
          <small>XP EARNED</small>
          <strong>+{animatedXp} XP</strong>
        </div>
        <div className="discovery-stat-box">
          <small>AI CONFIDENCE</small>
          <strong>{confidence != null ? `${confidence}%` : '—'}</strong>
        </div>
        <div className={`discovery-stat-box ${cardData.status !== 'provisional' ? 'verified' : ''}`}>
          <small>STATUS</small>
          <strong className={cardData.status === 'provisional' ? 'chip-pending' : 'chip-verified'}>
            {cardData.status === 'provisional' ? '⏳ Under review' : '✔ Verified'}
          </strong>
        </div>
      </div>

      {/* Description Text */}
      <p className="discovery-description">
        {cardData.description || `Discovered specimen of ${itemName} (${scientificName}). Verified by the Wild Realm engine.`}
      </p>

      {/* Metadata Strip */}
      <div className="discovery-env-strip-row">
        <div className="env-box">
          <small>LOCATION</small>
          <span>📍 {locationText}</span>
        </div>
        <div className="env-box">
          <small>DATE & TIME</small>
          <span>📅 {capturedAtDate}</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="discovery-action-btns">
        <motion.button
          type="button"
          className="discovery-btn-glass"
          onClick={onAddToLibrary}
          whileTap={{ scale: 0.95 }}
        >
          📖 ADD TO LIBRARY
        </motion.button>
        <motion.button
          type="button"
          className="discovery-btn-primary"
          onClick={onShare}
          whileTap={{ scale: 0.95 }}
        >
          🔗 SHARE
        </motion.button>
      </div>
    </motion.div>
  );
}


