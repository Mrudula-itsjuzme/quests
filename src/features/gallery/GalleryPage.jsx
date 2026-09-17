import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCaptures, useSpecies } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { SpeciesDetail } from './SpeciesDetail';
import { useJournalPreferences } from './useJournalPreferences';
import { Icon } from '../../components/Icon';
import { CaptureImage } from '../../components/CaptureImage';

const ELEMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'flora', label: 'Plants' },
  { id: 'places', label: 'Places' },
  { id: 'favorites', label: 'Favourites' },
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
  const {favorites,toggleFavorite,markViewed} = useJournalPreferences();
  const { data: captures, isLoading: capturesLoading, isError: capturesError, isFetching: capturesFetching, refetch: retryCaptures } = useCaptures();
  const { data: species, isError: speciesError, isFetching: speciesFetching, refetch: retrySpecies } = useSpecies();
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const isLoading = capturesLoading;

  const collection = useMemo(
    () => (captures || []).filter((c) => c.status !== 'rejected'),
    [captures],
  );

  const displayList = useMemo(() => {
    const speciesById = new Map((species || []).map((s) => [s.id, s]));
    let filtered = collection;
    if (activeTab === 'favorites') {
      filtered = collection.filter(c=>favorites.includes(c.id));
    } else if (activeTab !== 'all') {
      const categories = { wildlife: ['Fauna'], flora: ['Flora'], places: ['Landscape', 'Heritage'] };
      filtered = collection.filter((c) => categories[activeTab]?.includes(speciesById.get(c.speciesId)?.category || c.category));
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
  }, [collection, species, activeTab, sortBy, searchQuery, favorites]);

  const speciesCount = new Set(collection.filter((c) => ['Fauna', 'Flora'].includes((species || []).find((entry) => entry.id === c.speciesId)?.category || c.category)).map((c) => c.speciesId || c.itemName || c.cardTitle).filter(Boolean)).size;
  const placeCount = new Set(collection.map((c) => {
    const category = (species || []).find((entry) => entry.id === c.speciesId)?.category || c.category;
    return ['Landscape', 'Heritage'].includes(category) ? (c.speciesId || c.itemName || c.cardTitle) : null;
  }).filter(Boolean)).size;

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
              <h1>My Journal</h1>
            </div>
            <button type="button" className="gallery-icon-btn" aria-label="Search" onClick={() => setShowSearch(true)}>
              <Icon name="search" />
            </button>
          </>
        )}
      </div>

      {/* ── Stats strip ── */}
      {(!capturesError || captures) && <section className="library-hero-panel" aria-label="Library summary">
        <dl className="gallery-v2-stats">
          <div className="gallery-v2-stat"><dd>{collection.length}</dd><dt>Captures</dt></div>
          <div className="gallery-v2-stat"><dd>{speciesCount}</dd><dt>Species</dt></div>
          <div className="gallery-v2-stat"><dd>{placeCount}</dd><dt>Places</dt></div>
        </dl>
      </section>}

      {/* ── Element filter tabs ── */}
      <div className="gallery-v2-tabs">
        {ELEMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`gallery-v2-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { playTap(); setActiveTab(tab.id); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sort row ── */}
      {displayList.length > 0 && showSearch && (
        <div className="gallery-v2-sort-row">
          <span className="gallery-v2-count">{displayList.length} {displayList.length === 1 ? 'card' : 'cards'}</span>
          <div className="gallery-sort-pills">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`gallery-sort-pill ${sortBy === opt.value ? 'active' : ''}`}
                onClick={() => { playTap(); setSortBy(opt.value); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {(capturesError || speciesError) && <div className="library-load-error" role="alert">
        <p>{capturesError ? 'Your journal could not refresh. Your saved discoveries have not been deleted.' : 'Species details could not load. Your saved photos are still available.'}</p>
        <button type="button" className="primary-action" disabled={capturesFetching || speciesFetching} onClick={() => { if (capturesError) retryCaptures(); if (speciesError) retrySpecies(); }}>Try again</button>
      </div>}
      {isLoading ? (
        <div className="gallery-v2-loading" aria-busy="true">
          {[0,1,2,3].map((i) => <div key={i} className="gallery-v2-skeleton" />)}
        </div>
      ) : capturesError && !captures ? null : displayList.length === 0 ? (
        <div className="library-start-card">
          <div className="library-empty-media" aria-hidden="true">
            <div className="gallery-empty-icon"><Icon name="camera" /></div>
          </div>
          <div className="library-start-panel">
            <span className="sr-only">Your collection starts here.</span>
            <span className="library-loop-kicker">Collection loop</span>
            <h3>
              {collection.length === 0
                ? 'Start your Journal.'
                : searchQuery ? 'No matching discoveries.' : `No ${(ELEMENT_TABS.find((tab) => tab.id === activeTab)?.label || 'matching').toLowerCase()} finds yet.`}
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
            {displayList.map((card, i) => {
              const stars = card.rarityStars ?? 1;
              const speciesEntry = (species || []).find((s) => s.id === card.speciesId);
              const gradeColor = GRADE_COLORS[stars] || GRADE_COLORS[1];
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  className={`gallery-v2-card rank-${stars}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i, 10) * 0.025, type: 'spring', stiffness: 380, damping: 28 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playTap();
                    markViewed(card.id);
                    setSelectedCard(card);
                  }}
                  aria-label={`Open ${card.itemName || card.cardTitle}, ${stars} star rank`}
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

                  </div>
                </motion.button>
              );
            })}

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
            <SpeciesDetail
              key={selectedCard.id}
              card={selectedCard}
              species={species}
              collection={collection}
              onSelect={card=>{markViewed(card.id);setSelectedCard(card);}}
              favorite={favorites.includes(selectedCard.id)}
              onFavorite={()=>toggleFavorite(selectedCard.id)}
              onClose={()=>setSelectedCard(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
