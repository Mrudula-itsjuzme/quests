import { Share2, MapPin, NotebookPen, Sparkles, BadgeCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { CaptureImage } from '../../components/CaptureImage';

function useCountUp(targetValue, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!targetValue) return;
    let startTimestamp = null;
    let animId = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easeOutQuad * targetValue));
      if (progress < 1) animId = window.requestAnimationFrame(step);
    };
    animId = window.requestAnimationFrame(step);
    
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [targetValue, duration]);
  return count;
}

// Share card to Instagram/other platforms via Web Share API
async function shareToInstagram(cardTitle, gradeLabel, xp, imageUrl) {
  const shareText = `🌿 I found a ${gradeLabel} "${cardTitle}" in Wild Realm! +${xp} XP\n#WildRealm #NatureExplorer`;
  if (navigator.share && imageUrl) {
    try {
      // Fetch image as blob for sharing
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'discovery.jpg', { type: blob.type });
      await navigator.share({ title: cardTitle, text: shareText, files: [file] });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
    }
  }
  // Fallback: copy text
  try { await navigator.clipboard.writeText(shareText); return 'copied'; } catch { /* ignore */ }
  return 'fallback';
}

export function DiscoveryCard({
  card,
  species,
  imageUrl,
  imageFilter,
  isNew = false,
  titleValue,
  onTitleChange,
  notesValue = '',
  onNotesChange,
  onAddToLibrary,
  onShare,
  onClose,
  filterName,
  postToCommunity = false,
  onPostToCommunityChange,
  saving = false,
  layoutIdPrefix = '',
}) {
  const cardData = card || {};
  const speciesEntry = species?.find((entry) => entry.id === cardData.speciesId) || null;
  const itemName = cardData.itemName || cardData.cardTitle || cardData.title || 'Discovered Creature';
  const scientificName = cardData.scientificName || speciesEntry?.scientificName || null;
  const cardImg = cardData.imageRef || imageUrl || cardData.imageUrl || null;
  const rawXp = cardData.xpAwarded ?? cardData.xpEarned ?? cardData.xp ?? 0;
  const animatedXp = useCountUp(rawXp, 1000);
  const coins = cardData.coinsAwarded ?? 0;
  const confidence = cardData.confidence != null ? Math.round(cardData.confidence * 100) : null;
  const locationText = cardData.location
    || (cardData.gps ? `${cardData.gps.lat?.toFixed(4)}°N, ${cardData.gps.lng?.toFixed(4)}°E` : null);
  const rarityTierRaw = (cardData.rarityGrade || cardData.rarityTier || cardData.rarity || 'D').toUpperCase();
  const stars = cardData.rarityStars ?? (
    rarityTierRaw === 'S' || rarityTierRaw === 'LEGENDARY' ? 5 :
    rarityTierRaw === 'A' || rarityTierRaw === 'EPIC' ? 4 :
    rarityTierRaw === 'B' || rarityTierRaw === 'RARE' ? 3 :
    rarityTierRaw === 'C' || rarityTierRaw === 'UNCOMMON' ? 2 :
    1
  );
  const gradeLabel = `${stars} Star`;
  const rarityTier = `${stars}`;
  const elementCategory = cardData.element || speciesEntry?.element || cardData.category || null;
  const aiCaption = cardData.description || speciesEntry?.encyclopedia || speciesEntry?.summary || null;
  const capturedAtDate = cardData.capturedAt
    ? new Date(cardData.capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const cardId = cardData.assetId || cardData.id || 'new';
  const [shareNotice, setShareNotice] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  // 3D tilt
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
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handlePointerLeave = () => { x.set(0); y.set(0); };

  const handleInstagramShare = async () => {
    const result = await shareToInstagram(itemName, gradeLabel, rawXp, cardImg);
    if (result === 'copied') setShareNotice('Caption copied! Open Instagram and paste it.');
    else if (result === 'shared') setShareNotice('Shared! 🎉');
    setTimeout(() => setShareNotice(''), 3000);
  };

  if (isNew) return (
    <article className="reference-identification">
      {cardImg && <CaptureImage className="reference-identification-photo" imageRef={cardImg} alt={itemName} useAuth={cardImg?.includes('/captures/')} eager style={{filter:imageFilter && imageFilter!=='none'?imageFilter:undefined}}/>}
      <div className="reference-identification-shade" />
      <button className="reference-identification-share" aria-label="Share to other apps" onClick={()=>onShare?.({caption:notesValue.trim() || undefined})}><Share2 size={21}/></button>
      <section className="reference-identification-content">
        <h2>{titleValue || itemName}</h2>
        {filterName && <span className="reference-preview-filter">{filterName} filter</span>}
        {scientificName && <em>{scientificName}</em>}
        <div className="reference-identification-badges"><span><BadgeCheck size={15}/>{stars > 0 ? ['Common','Uncommon','Rare','Epic','Legendary'][Math.min(4, stars-1)] : 'Not identified'}</span>{confidence != null && <span><Sparkles size={15}/>{confidence}% match</span>}</div>
        <ul className="reference-identification-meta">
          {rawXp>0 && <li><Sparkles size={16}/><span>+{rawXp} XP</span></li>}
          <li><NotebookPen size={16}/><span>Ready for your Journal</span></li>
          <li><MapPin size={16}/><span>{locationText || 'Location not recorded'}</span></li>
        </ul>
        <p className="reference-ai-note"><strong aria-hidden="true">!</strong> AI can make mistakes. Check the identification and edit your notes before saving.</p>
        {onPostToCommunityChange && <label className="reference-post-toggle"><input type="checkbox" checked={postToCommunity} onChange={e=>onPostToCommunityChange(e.target.checked)} />Post to Community<span>{postToCommunity ? 'Visible in the community feed' : 'No community post'}</span></label>}
        {detailsOpen && <div className="reference-identification-details">
          <p>{aiCaption || 'No field observation was returned.'}</p>
          <label htmlFor="identification-title">Discovery name</label><input id="identification-title" value={titleValue ?? itemName} maxLength={80} onChange={e=>onTitleChange?.(e.target.value)}/>
          <label htmlFor="identification-notes">Notes</label><textarea id="identification-notes" value={notesValue} maxLength={500} rows={3} onChange={e=>onNotesChange?.(e.target.value)} placeholder="What did you notice?"/>
        </div>}
        <div className="reference-identification-actions"><button onClick={()=>setDetailsOpen(!detailsOpen)} aria-expanded={detailsOpen}>{detailsOpen?'Done editing':'Edit details'}</button><button disabled={saving} onClick={onAddToLibrary}>{saving?'Saving…':postToCommunity?'Save & post':'Save to Journal'}</button></div>
      </section>
    </article>
  );

  return (
    <motion.div
      layoutId={layoutIdPrefix ? `${layoutIdPrefix}card-${cardId}` : undefined}
      className={`discovery-card-modal rank-${rarityTier.toLowerCase()}`}
      ref={cardRef}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Top bar */}
      <div className="discovery-modal-header">
        <button type="button" className="discovery-close-btn" onClick={onClose || onAddToLibrary} aria-label="Close">
          <Icon name="plus" />
        </button>
        <span className="discovery-header-badge">{isNew ? '✨ New Discovery' : gradeLabel}</span>
        <button type="button" className="discovery-share-top-btn" onClick={() => onShare?.({ caption: notesValue.trim() || undefined })} aria-label="Share">
          <Icon name="feather" />
        </button>
      </div>

      {/* ── 65% Hero Photo ── */}
      <motion.div
        layoutId={layoutIdPrefix ? `${layoutIdPrefix}img-${cardId}` : undefined}
        className="discovery-hero-frame"
        style={{ aspectRatio: '4/3' }}
      >
        {cardImg ? (
          <CaptureImage
            imageRef={cardImg}
            alt={itemName}
            element={elementCategory}
            className="discovery-hero-image"
            eager
            useAuth={cardImg?.includes('/captures/')}
            style={{ filter: imageFilter && imageFilter !== 'none' ? imageFilter : undefined }}
          />
        ) : (
          <div className={`discovery-hero-fallback rank-hex-${rarityTier.toLowerCase()}`} role="img" aria-label={`${itemName}, ${gradeLabel} rank`}>
            <span>{stars}★</span>
          </div>
        )}

        {/* Holographic glare for S/A rank */}
        {(stars >= 4) && (
          <motion.div
            className="discovery-holo-glare"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.35) 0%, rgba(245,158,11,0.15) 40%, transparent 80%)`,
            }}
          />
        )}

        {/* XP badge floating on photo */}
        {rawXp > 0 && (
          <motion.div
            className="discovery-xp-badge"
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 20 }}
          >
            +{animatedXp} XP
          </motion.div>
        )}

        {/* Rarity badge on photo */}
        <div className={`discovery-photo-rarity rank-hex-${rarityTier.toLowerCase()}`} aria-label={`${gradeLabel} rank`}>
          {stars}★
        </div>
      </motion.div>

      {/* ── Card body: 35% info ── */}
      <div className="discovery-card-body">
        {/* Title + stars */}
        <div className="discovery-title-row">
          <div className="discovery-title-info">
            {isNew && onTitleChange ? (
              <input
                className="discovery-title-input"
                value={titleValue ?? itemName}
                onChange={(e) => onTitleChange(e.target.value)}
                maxLength={80}
                placeholder="Name this discovery…"
                aria-label="Card name"
              />
            ) : (
              <h2>{itemName}</h2>
            )}
            {scientificName && <em className="discovery-sci-name">{scientificName}</em>}
            {stars != null && (
              <span className="discovery-stars" aria-label={`${stars} of 5 rarity stars`}>
                {'★'.repeat(stars)}<i>{'★'.repeat(Math.max(0, 5 - stars))}</i>
              </span>
            )}
          </div>
        </div>

        {/* ── 3-section info area ── */}
        <div className="discovery-info-sections">
          {/* 1. AI Caption / Observed */}
          <div className="discovery-info-section">
            <span className="discovery-info-label">🤖 AI Observed</span>
            <p className="discovery-info-value">
              {aiCaption || (confidence != null
                ? `Identification confidence: ${confidence}%. No field observation was returned.`
                : 'Still identifying this discovery. No field observation is available yet.')}
            </p>
          </div>

          {/* 2. Location */}
          <div className="discovery-info-section">
            <span className="discovery-info-label">📍 Location</span>
            <p className="discovery-info-value">{locationText || 'Location not recorded'}</p>
            <span className="discovery-info-date">{capturedAtDate}</span>
          </div>

          {/* 3. Notes */}
          <div className="discovery-info-section">
            <span className="discovery-info-label">📝 Notes</span>
            {isNew && onNotesChange ? (
              <textarea
                className="discovery-notes-input"
                value={notesValue}
                onChange={(e) => onNotesChange(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Mood, habitat, what you noticed…"
              />
            ) : (
              <p className="discovery-info-value">{notesValue || cardData.notes || '—'}</p>
            )}
          </div>
        </div>

        {/* Element / category tags */}
        {elementCategory && (
          <div className="discovery-element-tags">
            <span className="discovery-tag">{elementCategory}</span>
            {confidence != null && <span className="discovery-tag">{confidence}% match</span>}
          </div>
        )}

        {/* Coins stat (if any) */}
        {coins > 0 && (
          <div className="discovery-coins-row">
            <Icon name="coin" /> <strong>+{coins} coins</strong>
          </div>
        )}

        {/* Share notice */}
        {shareNotice && (
          <motion.p
            className="discovery-share-notice"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {shareNotice}
          </motion.p>
        )}

        {/* Action buttons */}
        <div className="discovery-action-btns">
          <motion.button
            type="button"
            className="discovery-btn-glass"
            onClick={onAddToLibrary}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="book" /> {isNew ? 'Save to Library' : 'Close'}
          </motion.button>

          {/* Community share */}
          <motion.button
            type="button"
            className="discovery-btn-primary"
            onClick={() => onShare?.({ caption: notesValue.trim() || undefined })}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="feather" /> Share
          </motion.button>

          {/* Instagram / native share */}
          <motion.button
            type="button"
            className="discovery-btn-insta"
            onClick={handleInstagramShare}
            whileTap={{ scale: 0.95 }}
            title="Share to Instagram / device"
          >
            📸
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
