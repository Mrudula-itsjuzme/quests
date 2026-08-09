import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollectibles } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { DiscoveryCard } from '../world/DiscoveryCard';

const CATEGORY_BGS = {
  Fire: { imageUrl: '/assets/fire-volcano.png', bgGradient: 'linear-gradient(180deg, rgba(239, 68, 68, 0.2), rgba(6, 9, 7, 0.9))' },
  Water: { imageUrl: '/assets/water-fall.png', bgGradient: 'linear-gradient(180deg, rgba(59, 130, 246, 0.2), rgba(6, 9, 7, 0.9))' },
  Grass: { imageUrl: '/assets/verdant-explorer-banner.png', bgGradient: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(6, 9, 7, 0.9))' },
  Familiars: { imageUrl: '/assets/african-grey-parrot.png', bgGradient: 'linear-gradient(180deg, rgba(245, 158, 11, 0.2), rgba(6, 9, 7, 0.9))' },
  Earth: { imageUrl: '/assets/earth-mountain.png', bgGradient: 'linear-gradient(180deg, rgba(168, 85, 247, 0.2), rgba(6, 9, 7, 0.9))' },
  Sky: { imageUrl: '/assets/sky-aurora.png', bgGradient: 'linear-gradient(180deg, rgba(14, 165, 233, 0.2), rgba(6, 9, 7, 0.9))' },
};

const ELEMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Fire', label: '🔥 Fire' },
  { id: 'Water', label: '💧 Water' },
  { id: 'Grass', label: '🌿 Grass' },
  { id: 'Familiars', label: '🐾 Familiars' },
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
  const { data: collection, isLoading } = useCollectibles();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);

  const displayList = useMemo(() => {
    if (!collection) return [];
    if (activeTab === 'all') return collection;
    return collection.filter((c) => (c.category || c.element || 'Familiars').toLowerCase() === activeTab.toLowerCase());
  }, [collection, activeTab]);

  const categoryTiles = useMemo(() => {
    return Object.entries(CATEGORY_BGS).map(([id, bg]) => {
      const count = (collection || []).filter(c => (c.category || c.element || 'Familiars').toLowerCase() === id.toLowerCase()).length;
      return { id, label: id.toUpperCase(), count, ...bg };
    }).filter(tile => tile.count > 0 || activeTab === 'all'); // Show all in 'all' view, or only populated if needed
  }, [collection, activeTab]);

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
          <small>Total Cards</small>
          <strong>{(collection || []).length}</strong>
        </div>
        <div className="library-stat-item">
          <small>S Rank</small>
          <strong>{(collection || []).filter((c) => c.rarityTier === 'S' || c.rarity === 'S').length}</strong>
        </div>
        <div className="library-stat-item">
          <small>XP Earned</small>
          <strong>{(collection || []).reduce((acc, c) => acc + (c.xpEarned || c.xp || 0), 0).toLocaleString()}</strong>
        </div>
      </div>

      {/* Element Category Tabs */}
      <div className="library-element-tabs">
        {ELEMENT_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            type="button"
            className={`library-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              playTap();
              setActiveTab(tab.id);
            }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wild-text-dim)' }}>Loading collection...</div>
      ) : displayList.length === 0 && activeTab !== 'all' ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wild-text-dim)' }}>
          No discoveries in this category yet.
        </div>
      ) : activeTab === 'all' ? (
        <div className="library-card-grid">
          {categoryTiles.map((cat, i) => (
            <motion.div
              key={cat.id}
              className="library-photo-card"
              custom={i}
              initial="hidden"
              animate="visible"
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
                    {cat.count} Discovered
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
          <div className="library-card-grid">
            {displayList.map((card, i) => {
              const rarity = card.rarityTier || card.rarity || 'A';
              return (
                <motion.div
                  key={card.assetId || card.id}
                  className={`library-photo-card rank-${rarity.toLowerCase()}`}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playTap();
                    setSelectedCard(card);
                  }}
                >
                  <div className="library-card-img-wrap">
                    <img className="library-card-img" src={card.imageUrl} alt={card.itemName || card.title} />
                    <div className={`library-card-badge rank-badge-${rarity.toLowerCase()}`}>
                      {rarity}
                    </div>
                  </div>
                  <div className="library-card-info">
                    <h3 className="library-card-title">{card.itemName || card.title}</h3>
                    <p className="library-card-sub">{rarity} Rank</p>
                    <span className="library-card-stars" style={{ color: rarity === 'S' ? '#fbbf24' : rarity === 'A' ? '#c084fc' : '#60a5fa' }}>
                      ★★★★★
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Discovery Detail Modal */}
      <AnimatePresence>
        {selectedCard && (
          <div
            className="selection-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DiscoveryCard
                card={selectedCard}
                imageUrl={selectedCard.imageUrl}
                onAddToLibrary={() => setSelectedCard(null)}
                onShare={() => setSelectedCard(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}



