import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollectibles } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { DiscoveryCard } from '../world/DiscoveryCard';

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
    itemName: 'Blue-billed Cuckoo',
    scientificName: 'Phaenicophaeus diardi',
    rarityTier: 'A',
    element: 'Water',
    imageUrl: '/assets/blue-billed-cuckoo.png',
    location: 'Borneo, Malaysia',
    stars: '★★★★☆',
    xpEarned: 650,
  },
  {
    assetId: 'w3',
    itemName: 'Red Fox',
    scientificName: 'Vulpes vulpes',
    rarityTier: 'B',
    element: 'Grass',
    imageUrl: '/assets/verdant-explorer-banner.png',
    location: 'Black Forest, Germany',
    stars: '★★★☆☆',
    xpEarned: 400,
  },
  {
    assetId: 'w4',
    itemName: 'Snow Leopard',
    scientificName: 'Panthera uncia',
    rarityTier: 'S',
    element: 'Familiars',
    imageUrl: '/assets/african-grey-parrot.png',
    location: 'Himalayas, Nepal',
    stars: '★★★★★',
    xpEarned: 1200,
  },
];

const ELEMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Fire', label: '🔥 Fire' },
  { id: 'Water', label: '💧 Water' },
  { id: 'Grass', label: '🌿 Grass' },
  { id: 'Familiars', label: '🐾 Familiars' },
];

export function GalleryPage() {
  const { data: collection } = useCollectibles();
  const [activeTab, setActiveTab] = useState('all');
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
      stars: '★★★★☆',
      xpEarned: 500,
    }));

    const combined = [...userCards, ...SAMPLE_WILDLIFE];
    if (activeTab === 'all') return combined;
    return combined.filter((c) => c.element.toLowerCase() === activeTab.toLowerCase());
  }, [collection, activeTab]);

  return (
    <main className="library-shell">
      <div className="library-header">
        <h1>LIBRARY</h1>
      </div>

      {/* Element Category Tabs */}
      <div className="library-element-tabs">
        {ELEMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`library-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              playTap();
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Collection Summary Stats Bar */}
      <div className="library-stats-bar">
        <div className="library-stat-item">
          <small>Total Cards</small>
          <strong>{displayList.length + 148}</strong>
        </div>
        <div className="library-stat-item">
          <small>S Rank</small>
          <strong>12</strong>
        </div>
        <div className="library-stat-item">
          <small>Total XP</small>
          <strong>48,750</strong>
        </div>
      </div>

      {/* 2-Column Photographic Card Grid */}
      <div className="library-card-grid">
        {displayList.map((card) => (
          <motion.div
            key={card.assetId}
            className={`library-photo-card rank-${card.rarityTier.toLowerCase()}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              playTap();
              setSelectedCard(card);
            }}
          >
            <div className="library-card-img-wrap">
              <img className="library-card-img" src={card.imageUrl} alt={card.itemName} />
              <div className="library-card-badge">{card.rarityTier}</div>
            </div>
            <div className="library-card-info">
              <h3 className="library-card-title">{card.itemName}</h3>
              <p className="library-card-sub">📍 {card.location}</p>
              <span className="library-card-stars">{card.stars}</span>
            </div>
          </motion.div>
        ))}
      </div>

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


