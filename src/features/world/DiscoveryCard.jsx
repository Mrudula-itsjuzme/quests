import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { AuthImage } from '../../components/AuthImage';
import { CaptureImage } from '../../components/CaptureImage';

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

const GRADE_LABELS = { S: 'LEGENDARY', A: 'EPIC', B: 'RARE', C: 'UNCOMMON', D: 'COMMON' };

export function DiscoveryCard({ card, species, imageUrl, isNew = false, onAddToLibrary, onShare, onClose, layoutIdPrefix = '' }) {
  const cardData = card || {};
  // The species catalog carries the scientific name and element; the capture
  // row only stores the species id, so resolve rather than guess.
  const speciesEntry = species?.find((entry) => entry.id === cardData.speciesId) || null;
  const itemName = cardData.itemName || cardData.cardTitle || cardData.title || 'Discovered Creature';
  const scientificName = cardData.scientificName || speciesEntry?.scientificName || null;
  // The API serves photography as `imageRef` (a same-origin media URL); raw
  // base64 is no longer part of the contract. `imageUrl` stays as an explicit
  // caller override for the freshly-captured frame before the card is saved.
  const cardImg = cardData.imageRef || imageUrl || cardData.imageUrl || null;
  const rawXp = cardData.xpAwarded ?? cardData.xpEarned ?? cardData.xp ?? 0;
  const animatedXp = useCountUp(rawXp, 1000);
  const coins = cardData.coinsAwarded ?? 0;
  const confidence = cardData.confidence != null ? Math.round(cardData.confidence * 100) : null;
  const locationText = cardData.location
    || (cardData.gps ? `${cardData.gps.lat?.toFixed(2)}°, ${cardData.gps.lng?.toFixed(2)}°` : null);
  // rarityGrade is the S–D grade from the rarity engine; rarityTier is the
  // legacy Bronze/Silver label kept for older collectibles.
  const rarityTier = (cardData.rarityGrade || cardData.rarityTier || cardData.rarity || 'D').toUpperCase();
  const gradeLabel = GRADE_LABELS[rarityTier] || rarityTier;
  const stars = cardData.rarityStars ?? null;
  const elementCategory = cardData.element || speciesEntry?.element || cardData.category || null;
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
          aria-label="Close discovery card"
        >
          <Icon name="plus" />
        </button>
        {/* Only a just-minted card is a new discovery; the same component also
            renders existing cards opened from the collection. */}
        <span className="discovery-header-badge">{isNew ? 'New discovery' : gradeLabel}</span>
        <button
          type="button"
          className="discovery-share-top-btn"
          onClick={onShare}
          aria-label="Share discovery"
        >
          <Icon name="feather" />
        </button>
      </div>

      {/* Hero Image Frame with Holographic Overlay */}
      <motion.div layoutId={layoutIdPrefix ? `${layoutIdPrefix}img-${cardId}` : undefined} className="discovery-hero-frame">
        {cardImg ? (
          <CaptureImage
            imageRef={cardImg}
            alt={itemName}
            element={elementCategory}
            className="discovery-hero-image"
            eager
            useAuth={cardImg?.includes('/captures/')}
          />
        ) : (
          // No stored media for this capture: the rarity crest stands in
          // rather than an unrelated stock animal.
          <div className={`discovery-hero-fallback rank-hex-${rarityTier.toLowerCase()}`} role="img" aria-label={`${itemName}, ${gradeLabel} rank`}>
            <span>{rarityTier}</span>
          </div>
        )}

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
          {scientificName && <em>{scientificName}</em>}
          <div className="discovery-element-tags">
            {elementCategory && <span className="discovery-tag">{elementCategory}</span>}
            {stars != null && (
              <span className="discovery-tag discovery-stars" aria-label={`${stars} of 5 rarity stars`}>
                {'★'.repeat(stars)}<i>{'★'.repeat(Math.max(0, 5 - stars))}</i>
              </span>
            )}
          </div>
        </div>

        {/* Rarity Hexagon Badge */}
        <motion.div 
          className="discovery-hex-badge-wrap"
          initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
        >
          <div className={`discovery-hex-badge rank-hex-${rarityTier.toLowerCase()}`}>
            <span>{rarityTier}</span>
          </div>
          <small>{gradeLabel}</small>
        </motion.div>
      </div>

      {/* 4-Column Stat Grid */}
      <motion.div 
        className="discovery-stat-grid"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className={`discovery-stat-box ${rarityTier === 'S' ? 'gold' : ''}`}>
          <small>RARITY</small>
          <strong>{rarityTier} Rank</strong>
          <span className="stat-sub font-gold">({gradeLabel})</span>
        </div>
        <div className="discovery-stat-box gold">
          <small>XP EARNED</small>
          <strong>+{animatedXp} XP</strong>
          {coins > 0 && <span className="stat-sub font-gold">+{coins} coins</span>}
        </div>
        <div className="discovery-stat-box">
          <small>AI CONFIDENCE</small>
          <strong>{confidence != null ? `${confidence}%` : '—'}</strong>
        </div>
        {/* 'rejected' must never read as verified — each status gets its own chip. */}
        <div className={`discovery-stat-box ${cardData.status === 'final' ? 'verified' : ''}`}>
          <small>STATUS</small>
          <strong className={`chip-${cardData.status === 'final' ? 'verified' : cardData.status === 'rejected' ? 'rejected' : 'pending'}`}>
            {cardData.status === 'final' ? 'Verified' : cardData.status === 'rejected' ? 'Not verified' : 'Under review'}
          </strong>
        </div>
      </motion.div>

      {/* Description Text — species encyclopedia entry, never invented copy. */}
      {(cardData.description || speciesEntry?.encyclopedia) && (
        <motion.p
          className="discovery-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {cardData.description || speciesEntry.encyclopedia}
        </motion.p>
      )}

      {/* Metadata Strip */}
      <div className="discovery-env-strip-row">
        <div className="env-box">
          <small>LOCATION</small>
          <span>{locationText || 'Not recorded'}</span>
        </div>
        <div className="env-box">
          <small>DATE &amp; TIME</small>
          <span>{capturedAtDate}</span>
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
          <Icon name="book" /> {isNew ? 'Add to library' : 'Close'}
        </motion.button>
        <motion.button
          type="button"
          className="discovery-btn-primary"
          onClick={onShare}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name="feather" /> Share
        </motion.button>
      </div>
    </motion.div>
  );
}


