import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollectibles } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { DiscoveryCard } from '../world/DiscoveryCard';

const CATEGORY_TILES = [
  { id: 'Fire', label: 'FIRE', count: '32 / 60', imageUrl: '/assets/fire-volcano.png', bgGradient: 'linear-gradient(180deg, rgba(239, 68, 68, 0.2), rgba(6, 9, 7, 0.9))' },
  { id: 'Water', label: 'WATER', count: '41 / 68', imageUrl: '/assets/water-fall.png', bgGradient: 'linear-gradient(180deg, rgba(59, 130, 246, 0.2), rgba(6, 9, 7, 0.9))' },
  { id: 'Grass', label: 'GRASS', count: '55 / 92', imageUrl: '/assets/verdant-explorer-banner.png', bgGradient: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(6, 9, 7, 0.9))' },
  { id: 'Familiars', label: 'FAMILIARS', count: '68 / 120', imageUrl: '/assets/african-grey-parrot.png', bgGradient: 'linear-gradient(180deg, rgba(245, 158, 11, 0.2), rgba(6, 9, 7, 0.9))' },
  { id: 'Earth', label: 'EARTH', count: '28 / 60', imageUrl: '/assets/earth-mountain.png', bgGradient: 'linear-gradient(180deg, rgba(168, 85, 247, 0.2), rgba(6, 9, 7, 0.9))' },
  { id: 'Sky', label: 'SKY', count: '32 / 70', imageUrl: '/assets/sky-aurora.png', bgGradient: 'linear-gradient(180deg, rgba(14, 165, 233, 0.2), rgba(6, 9, 7, 0.9))' },
];

const SAMPLE_WILDLIFE = [
  {
    assetId: 'w1',
    itemName: 'African Grey Parrot',
    scientificName: 'Psittacus erithacus',
    rarityTier: 'S',
    element: 'Familiars',
    imageUrl: '/assets/african-grey-parrot.png',
    location: 'Kakum, Ghana',
    stars: '★★★★★',
    xpEarned: 900,
  },
  {
    assetId: 'w2',
    itemName: 'Scarlet Macaw',
    scientificName: 'Ara macao',
    rarityTier: 'A',
    element: 'Familiars',
    imageUrl: '/assets/african-grey-parrot.png',
    location: 'Amazon Basin, Brazil',
    stars: '★★★★★',
    xpEarned: 750,
  },
  {
    assetId: 'w3',
    itemName: 'Bald Eagle',
    scientificName: 'Haliaeetus leucocephalus',
    rarityTier: 'A',
    element: 'Familiars',
    imageUrl: '/assets/blue-billed-cuckoo.png',
    location: 'Alaska, USA',
    stars: '★★★★★',
    xpEarned: 800,
  },
  {
    assetId: 'w4',
    itemName: 'Emperor Penguin',
    scientificName: 'Aptenodytes forsteri',
    rarityTier: 'B',
    element: 'Familiars',
    imageUrl: '/assets/african-grey-parrot.png',
    location: 'Antarctica',
    stars: '★★★★★',
    xpEarned: 500,
  },
  {
    assetId: 'w5',
    itemName: 'Red Fox',
    scientificName: 'Vulpes vulpes',
    rarityTier: 'B',
    element: 'Familiars',
    imageUrl: '/assets/verdant-explorer-banner.png',
    location: 'Black Forest, Germany',
    stars: '★★★★★',
    xpEarned: 450,
  },
  {
    assetId: 'w6',
    itemName: 'Snow Leopard',
    scientificName: 'Panthera uncia',
    rarityTier: 'A',
    element: 'Familiars',
    imageUrl: '/assets/african-grey-parrot.png',
    location: 'Himalayas, Nepal',
    stars: '★★★★★',
    xpEarned: 850,
  },
];

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
  const { data: collection } = useCollectibles();
  const [activeTab, setActiveTab] = useState('Familiars');
  const [selectedCard, setSelectedCard] = useState(null);

  const displayList = useMemo(() => {
    const userCards = (collection || []).map((item, idx) => ({
      assetId: item.assetId || `usr-${idx}`,
      itemName: item.itemName || item.title || 'Discovered Familiar',
      scientificName: item.scientificName || 'Fauna Wild',
      rarityTier: item.rarityTier || item.rarity || 'A',
      element: item.category || 'Familiars',
      imageUrl: item.imageUrl || (idx % 2 === 0 ? '/assets/african-grey-parrot.png' : '/assets/blue-billed-cuckoo.png'),
      location: item.location || 'Wild Sanctuary',
      stars: '★★★★★',
      xpEarned: 500,
    }));

    const combined = [...SAMPLE_WILDLIFE, ...userCards];
    if (activeTab === 'all') return combined;
    return combined.filter((c) => c.element.toLowerCase() === activeTab.toLowerCase());
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
          <strong>284</strong>
        </div>
        <div className="library-stat-item">
          <small>S Rank</small>
          <strong>28</strong>
        </div>
        <div className="library-stat-item">
          <small>XP Earned</small>
          <strong>58,450</strong>
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

      {/* View Mode: Category Overview Grid (when "all") vs 2-Column Card Grid */}
      {activeTab === 'all' ? (
        <div className="library-card-grid">
          {CATEGORY_TILES.map((cat, i) => (
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
                    {cat.count}
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
            {displayList.map((card, i) => (
              <motion.div
                key={card.assetId}
                className={`library-photo-card rank-${card.rarityTier.toLowerCase()}`}
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
                  <img className="library-card-img" src={card.imageUrl} alt={card.itemName} />
                  <div className={`library-card-badge rank-badge-${card.rarityTier.toLowerCase()}`}>
                    {card.rarityTier}
                  </div>
                </div>
                <div className="library-card-info">
                  <h3 className="library-card-title">{card.itemName}</h3>
                  <p className="library-card-sub">{card.rarityTier} Rank</p>
                  <span className="library-card-stars" style={{ color: card.rarityTier === 'S' ? '#fbbf24' : card.rarityTier === 'A' ? '#c084fc' : '#60a5fa' }}>
                    {card.stars}
                  </span>
                </div>
              </motion.div>
            ))}
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



