import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCaptures, useSpecies } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { DiscoveryCard } from '../world/DiscoveryCard';
import { Icon } from '../../components/Icon';
import { CaptureImage } from '../../components/CaptureImage';
import { appleEase, duration } from '../../components/motion/MotionVariants';

// Element identity is expressed with the design system's colour tokens rather
// than image files; the four element photos these tiles used to reference were
// never present in /public and 404'd.
const ELEMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'Fire', label: 'Fire' },
  { id: 'Water', label: 'Water' },
  { id: 'Grass', label: 'Grass' },
  { id: 'Earth', label: 'Earth' },
  { id: 'Sky', label: 'Sky' },
  // Familiars is the fauna bucket and cross-cuts elements (blueprint 2/8):
  // a bird is both a Familiar and Sky.
  { id: 'familiars', label: 'Familiars' },
];

// Highest grade first, matching the rarity engine's S–D scale.
const RARITY_ORDER = ['S', 'A', 'B', 'C', 'D'];

// Browsing the library is an ordinary action, not a reveal: the grid settles
// quickly and the stagger is capped so a large collection never trickles in.
// (Was delay i*0.06 with a 0.5s duration — tile 6 finished at ~800ms.)
const cardVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.985 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 8) * 0.022, duration: duration.standard, ease: appleEase },
  }),
};

export function GalleryPage() {
  const { data: captures, isLoading: capturesLoading } = useCaptures();
  const { data: species, isLoading: speciesLoading } = useSpecies();
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');
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
    const speciesById = new Map((species || []).map((s) => [s.id, s]));
    const filtered = activeTab === 'all'
      ? collection
      : activeTab === 'familiars'
        ? collection.filter((c) => (speciesById.get(c.speciesId)?.category || c.category) === 'Fauna')
        : collection.filter((c) => (speciesById.get(c.speciesId)?.element || 'Earth') === activeTab);

    const byRarity = (card) => RARITY_ORDER.indexOf((card.rarityGrade || card.rarityTier || 'D').toUpperCase());
    return [...filtered].sort((left, right) => {
      if (sortBy === 'name') return (left.itemName || '').localeCompare(right.itemName || '');
      if (sortBy === 'recent') return new Date(right.capturedAt) - new Date(left.capturedAt);
      return byRarity(left) - byRarity(right) || new Date(right.capturedAt) - new Date(left.capturedAt);
    });
  }, [collection, species, activeTab, sortBy]);

  // Elements are derived from the catalog the server actually serves, so a new
  // element never needs a matching constant here to appear.
  const categoryTiles = useMemo(() => {
    const elements = [...new Set((species || []).map((s) => s.element).filter(Boolean))].sort();
    return elements.map((element) => {
      const speciesInElement = (species || []).filter((s) => s.element === element);
      const discoveredCount = speciesInElement.filter((s) => discoveredSpeciesIds.has(s.id)).length;
      const total = speciesInElement.length;
      const percent = total > 0 ? Math.round((discoveredCount / total) * 100) : 0;
      return { id: element, label: element.toUpperCase(), count: discoveredCount, total, percent };
    }).filter((tile) => tile.total > 0);
  }, [species, discoveredSpeciesIds]);

  const totalSpecies = species?.length || 0;
  const totalDiscovered = discoveredSpeciesIds.size;
  const almostComplete = categoryTiles.filter((t) => t.percent >= 70 && t.percent < 100);

  return (
    <main className="library-shell">
      {/* Compact Header */}
      <div className="library-header">
        <h1>My Library</h1>
        <motion.button
          type="button"
          className="library-search-btn"
          aria-label="Search collection"
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="search" />
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
                    background: 'rgba(245, 158, 11, 0.12)',
                    borderRadius: '999px',
                    zIndex: -1,
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)'
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
          className="intentional-empty-state"
        >
          <div className="empty-icon-wrapper">
            <Icon name={activeTab === 'Water' ? 'droplet' : activeTab === 'Fire' ? 'flame' : (activeTab === 'Grass' || activeTab === 'Earth') ? 'leaf' : (activeTab === 'Sky' || activeTab === 'familiars') ? 'feather' : 'compass'} />
          </div>
          <h3>No discoveries found</h3>
          <p>You haven&apos;t discovered any {activeTab === 'familiars' ? 'Familiar' : activeTab} species yet.</p>
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
          className="intentional-empty-state"
        >
          <div className="empty-icon-wrapper">
            <Icon name="chest" />
          </div>
          <h3>Your collection starts here</h3>
          <p>Capture your first discovery to begin filling the library.</p>
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
                className={`library-element-tile element-${cat.id.toLowerCase()}`}
                custom={i}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={cardVariants}
                whileTap={{ scale: 0.97 }}
                role="button"
                tabIndex={0}
                onClick={() => { playTap(); setActiveTab(cat.id); }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); playTap(); setActiveTab(cat.id); }
                }}
              >
                <div className="library-element-tile-body">
                  <h3>{cat.label}</h3>
                  <span>{cat.count}/{cat.total} · {cat.percent}%</span>
                  <div className="library-element-progress" role="progressbar" aria-valuenow={cat.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat.label} completion`}>
                    <i style={{ width: `${cat.percent}%` }} />
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
              <label className="sr-only" htmlFor="library-sort">Sort collection</label>
              <select
                id="library-sort"
                value={sortBy}
                onChange={(event) => { playTap(); setSortBy(event.target.value); }}
              >
                <option value="rarity">Rarity</option>
                <option value="recent">Most recent</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* 2-Column Photographic Card Grid */}
          <motion.div layout className="library-card-grid">
            <AnimatePresence>
              {displayList.map((card, i) => {
                const rarity = (card.rarityGrade || card.rarityTier || 'D').toUpperCase();
                const cardId = card.id;
                const speciesEntry = (species || []).find((s) => s.id === card.speciesId);
                const stars = card.rarityStars ?? 0;
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
                      {/* Real capture photography when the API has media for
                          this card; the element crest stands in otherwise. */}
                      <CaptureImage
                        imageRef={card.imageRef}
                        alt={card.itemName}
                        element={speciesEntry?.element}
                        useAuth={card.imageRef?.includes('/captures/')}
                      />
                      <div className={`library-card-badge rank-badge-${rarity.toLowerCase()}`}>
                        {rarity}
                      </div>
                    </motion.div>
                    <motion.div layoutId={`discovery-info-${cardId}`} className="library-card-info">
                      <h3 className="library-card-title">{card.itemName}</h3>
                      <p className="library-card-sub">{rarity} Rank</p>
                      {/* Stars come from the rarity engine, not a fixed run of five. */}
                      <span className={`library-card-stars stars-${rarity.toLowerCase()}`} aria-label={`${stars} of 5 rarity stars`}>
                        {'★'.repeat(stars)}<i>{'★'.repeat(Math.max(0, 5 - stars))}</i>
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
              species={species}
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



