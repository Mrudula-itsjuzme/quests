import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCaptures, useSpecies } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { DiscoveryCard } from '../world/DiscoveryCard';

const CATEGORY_BGS = {
  Fire: { imageUrl: '/assets/fire-volcano.png', bgGradient: 'linear-gradient(180deg, rgba(239, 68, 68, 0.2), rgba(6, 9, 7, 0.9))' },
  Water: { imageUrl: '/assets/water-fall.png', bgGradient: 'linear-gradient(180deg, rgba(59, 130, 246, 0.2), rgba(6, 9, 7, 0.9))' },
  Grass: { imageUrl: '/assets/verdant-explorer-banner.png', bgGradient: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(6, 9, 7, 0.9))' },
  Earth: { imageUrl: '/assets/earth-mountain.png', bgGradient: 'linear-gradient(180deg, rgba(168, 85, 247, 0.2), rgba(6, 9, 7, 0.9))' },
  Sky: { imageUrl: '/assets/sky-aurora.png', bgGradient: 'linear-gradient(180deg, rgba(14, 165, 233, 0.2), rgba(6, 9, 7, 0.9))' },
};

const ELEMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Fire', label: '🔥 Fire' },
  { id: 'Water', label: '💧 Water' },
  { id: 'Grass', label: '🌿 Grass' },
  { id: 'Earth', label: '🐾 Earth' },
  { id: 'Sky', label: '🕊 Sky' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function GalleryPage() {
  const { data: captures, isLoading: capturesLoading } = useCaptures();
  const { data: species, isLoading: speciesLoading } = useSpecies();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const isLoading = capturesLoading || speciesLoading;

  // A species counts as "discovered" once any non-rejected capture references it.
  const discoveredSpeciesIds = useMemo(() => {
    const ids = new Set();
    for (const capture of captures || []) {
      if (capture.speciesId && capture.status !== 'rejected') ids.add(capture.speciesId);
    }
    return ids;
  }, [captures]);

  const collection = useMemo(() => (captures || []).filter((c) => c.status !== 'rejected'), [captures]);

  const displayList = useMemo(() => {
    if (activeTab === 'all') return collection;
    const speciesById = new Map((species || []).map((s) => [s.id, s]));
    return collection.filter((c) => (speciesById.get(c.speciesId)?.element || 'Earth') === activeTab);
  }, [collection, species, activeTab]);

  const categoryTiles = useMemo(() => {
    return Object.entries(CATEGORY_BGS).map(([element, bg]) => {
      const speciesInElement = (species || []).filter((s) => s.element === element);
      const discoveredCount = speciesInElement.filter((s) => discoveredSpeciesIds.has(s.id)).length;
      const total = speciesInElement.length;
      const percent = total > 0 ? Math.round((discoveredCount / total) * 100) : 0;
      return { id: element, label: element.toUpperCase(), count: discoveredCount, total, percent, ...bg };
    }).filter((tile) => tile.total > 0);
  }, [species, discoveredSpeciesIds]);

  const totalSpecies = species?.length || 0;
  const totalDiscovered = discoveredSpeciesIds.size;
  const almostComplete = categoryTiles.filter((t) => t.percent >= 70 && t.percent < 100);

  return (
    <main className="library-shell">
      {/* Compact Header */}
      <div className="library-header">
        <h1>MY LIBRARY</h1>
        <motion.button
          type="button"
          className="library-search-btn"
          aria-label="Search collection"
          whileTap={{ scale: 0.9 }}
        >
          🔍
        </motion.button>
      </div>

      {/* Collection Summary Stats Bar */}
      <div className="library-stats-bar">
        <div className="library-stat-item">
          <small>Species Found</small>
          <strong>{totalDiscovered}{totalSpecies > 0 ? ` / ${totalSpecies}` : ''}</strong>
        </div>
        <div className="library-stat-item">
          <small>S Rank</small>
          <strong>{collection.filter((c) => c.rarityTier === 'S').length}</strong>
        </div>
        <div className="library-stat-item">
          <small>XP Earned</small>
          <strong>{collection.reduce((acc, c) => acc + (c.xpAwarded || 0), 0).toLocaleString()}</strong>
        </div>
      </div>

      {almostComplete.length > 0 && (
        <div className="library-almost-complete-banner">
          {almostComplete.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className="library-almost-complete-pill"
              onClick={() => { playTap(); setActiveTab(tile.id); }}
            >
              {tile.total - tile.count} more to complete <strong>{tile.label}</strong> ({tile.percent}%)
            </button>
          ))}
        </div>
      )}

      {/* Element Category Tabs */}
      <div className="library-element-tabs" style={{ position: 'relative' }}>
        {ELEMENT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              className={`library-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                playTap();
                setActiveTab(tab.id);
              }}
              whileTap={{ scale: 0.95 }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {isActive && (
                <motion.div
                  layoutId="gallery-tab-indicator"
                  className="library-tab-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--quest-surface)',
                    borderRadius: '8px',
                    zIndex: -1,
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 2 }}>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wild-text-dim)' }}>Loading collection...</div>
      ) : displayList.length === 0 && activeTab !== 'all' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wild-text-dim)' }}
        >
          <p>You haven&apos;t discovered any {activeTab} species yet.</p>
          <motion.button
            type="button"
            className="continue-journey-btn"
            style={{ marginTop: '12px' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { playTap(); window.dispatchEvent(new CustomEvent('wild-realm-open-capture')); }}
          >
            Find nearby <span>→</span>
          </motion.button>
        </motion.div>
      ) : activeTab === 'all' && collection.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--wild-text-dim)' }}
        >
          <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Your collection starts here.</p>
          <p style={{ marginTop: '4px' }}>Capture your first discovery to begin filling the library.</p>
          <motion.button
            type="button"
            className="continue-journey-btn"
            style={{ marginTop: '12px' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { playTap(); window.dispatchEvent(new CustomEvent('wild-realm-open-capture')); }}
          >
            Start exploring <span>→</span>
          </motion.button>
        </motion.div>
      ) : activeTab === 'all' ? (
        <motion.div layout className="library-card-grid">
          <AnimatePresence>
            {categoryTiles.map((cat, i) => (
              <motion.div
                key={cat.id}
                layout
                className="library-photo-card"
                custom={i}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={cardVariants}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playTap();
                  setActiveTab(cat.id);
                }}
                style={{ height: '140px' }}
              >
                <div className="library-card-img-wrap" style={{ height: '100%' }}>
                  <img className="library-card-img" src={cat.imageUrl} alt={cat.label} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: cat.bgGradient,
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '900', margin: 0 }}>
                      {cat.label}
                    </h3>
                    <span style={{ color: 'var(--wild-text-dim)', fontSize: '0.75rem', fontWeight: '700' }}>
                      {cat.count}/{cat.total} Discovered · {cat.percent}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <>
          {/* Active Category Header */}
          <div className="library-category-header">
            <span className="library-category-label">
              {activeTab.toUpperCase()} ({displayList.length})
            </span>
            <div className="library-sort-controls">
              <span>Rarity ▾</span>
              <span>::</span>
            </div>
          </div>

          {/* 2-Column Photographic Card Grid */}
          <motion.div layout className="library-card-grid">
            <AnimatePresence>
              {displayList.map((card, i) => {
                const rarity = card.rarityTier || 'A';
                const cardId = card.id;
                const speciesEntry = (species || []).find((s) => s.id === card.speciesId);
                const placeholderImg = CATEGORY_BGS[speciesEntry?.element || 'Earth'].imageUrl;
                return (
                  <motion.div
                    key={cardId}
                    layoutId={`discovery-card-${cardId}`}
                    className={`library-photo-card rank-${rarity.toLowerCase()}`}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={cardVariants}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      playTap();
                      setSelectedCard(card);
                    }}
                  >
                    <motion.div layoutId={`discovery-img-${cardId}`} className="library-card-img-wrap">
                      <img className="library-card-img" src={placeholderImg} alt={card.itemName} loading="lazy" decoding="async" />
                      <div className={`library-card-badge rank-badge-${rarity.toLowerCase()}`}>
                        {rarity}
                      </div>
                    </motion.div>
                    <motion.div layoutId={`discovery-info-${cardId}`} className="library-card-info">
                      <h3 className="library-card-title">{card.itemName}</h3>
                      <p className="library-card-sub">{rarity} Rank</p>
                      <span className="library-card-stars" style={{ color: rarity === 'S' ? '#fbbf24' : rarity === 'A' ? '#c084fc' : '#60a5fa' }}>
                        ★★★★★
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Discovery Detail Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="selection-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedCard(null)}
            initial={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
            animate={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            exit={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          >
            <DiscoveryCard
              card={selectedCard}
              layoutIdPrefix="discovery-"
              onAddToLibrary={() => setSelectedCard(null)}
              onShare={() => setSelectedCard(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}



