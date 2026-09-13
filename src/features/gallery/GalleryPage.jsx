import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCaptures, useSpecies } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { DiscoveryCard } from '../world/DiscoveryCard';
import { Icon } from '../../components/Icon';
import { CaptureImage } from '../../components/CaptureImage';

const ELEMENT_TABS = [
  { id: 'all', label: 'All', emoji: '🌍' },
  { id: 'Fire', label: 'Fire', emoji: '🔥' },
  { id: 'Water', label: 'Water', emoji: '💧' },
  { id: 'Grass', label: 'Grass', emoji: '🌿' },
  { id: 'Earth', label: 'Earth', emoji: '🪨' },
  { id: 'Sky', label: 'Sky', emoji: '☁️' },
  { id: 'familiars', label: 'Fauna', emoji: '🦎' },
];

const RARITY_ORDER = [5, 4, 3, 2, 1];
const GRADE_COLORS = {
  5: '#f0c46b', 4: '#a78bfa', 3: '#60a5fa', 2: '#4ade80', 1: 'rgba(255,255,255,0.4)',
};

const SORT_OPTIONS = [
  { value: 'rarity', label: 'Rarity' },
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'Name' },
];

export function GalleryPage() {
  const { data: captures, isLoading: capturesLoading } = useCaptures();
  const { data: species, isLoading: speciesLoading } = useSpecies();
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [deckIndex, setDeckIndex] = useState(0);
  const isLoading = capturesLoading || speciesLoading;

  const collection = useMemo(
    () => (captures || []).filter((c) => c.status !== 'rejected'),
    [captures],
  );

  const displayList = useMemo(() => {
    const speciesById = new Map((species || []).map((s) => [s.id, s]));
    let filtered = collection;
    if (activeTab !== 'all') {
      filtered = activeTab === 'familiars'
        ? collection.filter((c) => (speciesById.get(c.speciesId)?.category || c.category) === 'Fauna')
        : collection.filter((c) => (speciesById.get(c.speciesId)?.element || c.element || 'Earth') === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) =>
        (c.itemName || '').toLowerCase().includes(q) ||
        (c.cardTitle || '').toLowerCase().includes(q)
      );
    }
    const byRarity = (card) => RARITY_ORDER.indexOf(card.rarityStars || 1);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return (a.itemName || '').localeCompare(b.itemName || '');
      if (sortBy === 'recent') return new Date(b.capturedAt) - new Date(a.capturedAt);
      return byRarity(a) - byRarity(b) || new Date(b.capturedAt) - new Date(a.capturedAt);
    });
  }, [collection, species, activeTab, sortBy, searchQuery]);

  const sRankCount = collection.filter((c) => c.rarityStars === 5).length;
  const totalXp = collection.reduce((sum, c) => sum + (c.xpAwarded ?? Math.max(25, Number(c.rarityStars || 1) * 25)), 0);
  const deckList = useMemo(() => {
    if (displayList.length < 2) return displayList;
    const start = deckIndex % displayList.length;
    return [...displayList.slice(start), ...displayList.slice(0, start)];
  }, [displayList, deckIndex]);

  const moveDeck = (direction) => {
    playTap();
    setFlippedCardId(null);
    setDeckIndex((current) => {
      if (displayList.length < 2) return 0;
      return (current + direction + displayList.length) % displayList.length;
    });
  };

  return (
    <main className="gallery-v2-shell">
      {/* ── Header ── */}
      <div className="gallery-v2-header">
        {showSearch ? (
          <div className="gallery-search-wrap">
            <input
              autoFocus
              className="gallery-search-input"
              placeholder="Search your collection…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" className="gallery-search-close" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>✕</button>
          </div>
        ) : (
          <>
            <div className="gallery-title-lockup">
              <h1>My Library</h1>
            </div>
            <button type="button" className="gallery-icon-btn" aria-label="Search" onClick={() => setShowSearch(true)}>
              <Icon name="search" />
            </button>
          </>
        )}
      </div>

      {/* ── Stats strip ── */}
      <section className="library-hero-panel" aria-label="Library summary">
        <div>
          <span className="library-kicker">Collection progress</span>
          <p>{collection.length} discoveries · {sRankCount} five-star</p>
        </div>
        <dl className="gallery-v2-stats">
          <div className="gallery-v2-stat">
            <dt>XP</dt>
            <dd>{totalXp.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      {/* ── Element filter tabs ── */}
      <div className="gallery-v2-tabs">
        {ELEMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`gallery-v2-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { playTap(); setActiveTab(tab.id); setDeckIndex(0); setFlippedCardId(null); }}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sort row ── */}
      {displayList.length > 0 && (
        <div className="gallery-v2-sort-row">
          <span className="gallery-v2-count">{displayList.length} {displayList.length === 1 ? 'card' : 'cards'}</span>
          <div className="gallery-sort-pills">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`gallery-sort-pill ${sortBy === opt.value ? 'active' : ''}`}
                onClick={() => { playTap(); setSortBy(opt.value); setDeckIndex(0); setFlippedCardId(null); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="gallery-v2-loading" aria-busy="true">
          {[0,1,2,3].map((i) => <div key={i} className="gallery-v2-skeleton" />)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="library-start-card">
          <div className="library-empty-media" aria-hidden="true">
            <div className="gallery-empty-icon"><Icon name="camera" /></div>
          </div>
          <div className="library-start-panel">
            <span className="sr-only">Your collection starts here.</span>
            <span className="library-loop-kicker">Collection loop</span>
            <h3>
              {collection.length === 0
                ? 'Start your Library.'
                : `No ${activeTab === 'familiars' ? 'Fauna' : activeTab} finds yet.`}
            </h3>
            <p>
              {collection.length === 0
                ? 'Snap, rank, note, and save a real-world find.'
                : 'Use Camera to capture a verified find for this category.'}
            </p>
          </div>
        </div>
      ) : (
        /* ── Instagram-style photo grid ── */
        <div className="gallery-v2-grid">
          <>
            {deckList.map((card, i) => {
              const stars = card.rarityStars ?? 1;
              const speciesEntry = (species || []).find((s) => s.id === card.speciesId);
              const gradeColor = GRADE_COLORS[stars] || GRADE_COLORS[1];
              const isFlipped = flippedCardId === card.id;
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  className={`gallery-v2-card rank-${stars} ${i === 0 ? 'gallery-v2-card-featured is-flippable' : ''} ${isFlipped ? 'is-flipped' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i, 10) * 0.025, type: 'spring', stiffness: 380, damping: 28 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playTap();
                    if (i === 0 && !isFlipped) setFlippedCardId(card.id);
                    else setSelectedCard(card);
                  }}
                  aria-label={i === 0 && !isFlipped
                    ? `Flip ${card.itemName}, ${stars} star rank`
                    : `Open ${card.itemName}, ${stars} star rank`}
                >
                  <div className="gallery-card-flipper">
                    <div className="gallery-card-face gallery-card-front">
                      <div className="gallery-v2-photo">
                        <CaptureImage
                          imageRef={card.imageRef}
                          alt={card.itemName}
                          element={speciesEntry?.element}
                          useAuth={card.imageRef?.includes('/captures/')}
                        />
                        <span
                          className="gallery-v2-rank-badge"
                          style={{ color: gradeColor, borderColor: gradeColor }}
                        >
                          {stars}★
                        </span>
                      </div>
                      <div className="gallery-v2-info">
                        <span className="gallery-v2-name">{card.itemName || card.cardTitle}</span>
                        <span className="gallery-v2-meta">
                          {speciesEntry?.element || card.element || 'Wild'}
                          {card.location ? ` · ${card.location}` : ''}
                        </span>
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="gallery-card-face gallery-card-back" aria-hidden={!isFlipped}>
                        <span className="gallery-card-back-rarity">{stars}★ discovery</span>
                        <strong>{card.itemName || card.cardTitle}</strong>
                        <p>{card.notes || `A ${speciesEntry?.element || card.element || 'wild'} find saved to your collection.`}</p>
                        <dl>
                          <div><dt>Element</dt><dd>{speciesEntry?.element || card.element || 'Wild'}</dd></div>
                          <div><dt>XP earned</dt><dd>{card.xpAwarded ?? Math.max(25, stars * 25)}</dd></div>
                        </dl>
                        <span className="gallery-card-back-action">Tap again for details</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
            {displayList.length > 1 && (
              <div className="gallery-deck-controls" aria-label="Browse collection cards">
                <button type="button" onClick={() => moveDeck(-1)} aria-label="Previous collection card">‹</button>
                <button type="button" onClick={() => moveDeck(1)} aria-label="Next collection card">›</button>
              </div>
            )}
          </>
        </div>
      )}

      {/* ── Discovery detail modal ── */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="selection-overlay"
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedCard(null); }}
            initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
            animate={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
            exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
          >
            <DiscoveryCard
              card={selectedCard}
              species={species}
              layoutIdPrefix="gallery-"
              onAddToLibrary={() => setSelectedCard(null)}
              onShare={() => setSelectedCard(null)}
              onClose={() => setSelectedCard(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
