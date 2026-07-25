import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AnimatedCollectible } from '../../components/AnimatedCollectible';
import { Icon, categoryColors, categoryIcon } from '../../components/Icon';
import { useCollectibles } from '../quests/queries';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'Mind', label: 'Mind' },
  { id: 'Body', label: 'Body' },
  { id: 'Discovery', label: 'Discovery' },
];

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

export function GalleryPage() {
  const { data: collection, isLoading, isError } = useCollectibles();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  const filtered = useMemo(
    () => (collection || []).filter((item) => filter === 'all' || item.category === filter),
    [collection, filter],
  );

  return (
    <main className="gallery-shell page-stack">
      <div className="page-heading">
        <div>
          <h1>Gallery</h1>
          <p>A chronological journal of every memory your account has actually unlocked.</p>
        </div>
      </div>

      {isLoading && <p role="status">Loading your memories...</p>}
      {isError && (
        <section className="panel" role="alert">
          <p>Could not load your collection right now.</p>
        </section>
      )}

      {!isLoading && !isError && (!collection || collection.length === 0) && (
        <section className="panel empty-gallery">
          <AnimatedCollectible collectible={{ category: 'Discovery' }} preview />
          <h2>No stickers unlocked yet</h2>
          <p>Complete a quest to add the first entry to this journal.</p>
        </section>
      )}

      {!isLoading && !isError && collection && collection.length > 0 && (
        <section className="panel" aria-label="Memory journal">
          <div className="segmented-control" role="group" aria-label="Filter memories by category">
            {filters.map((item) => (
              <button key={item.id} type="button" className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>
                {item.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="empty-state">No memories in this category yet.</p>
          ) : (
            <div className="journal-timeline">
              {filtered.map((item) => (
                <button
                  key={item.assetId}
                  type="button"
                  className="journal-entry"
                  onClick={() => setSelected(item)}
                >
                  <span className="journal-thumb" aria-hidden="true">
                    <Icon name={categoryIcon(item.category)} />
                  </span>
                  <span className="journal-entry-copy">
                    <strong>{item.title}</strong>
                    <span className="journal-entry-meta">
                      <span className={`pill ${categoryColors[item.category] || ''}`}>{item.category}</span>
                      <span>{item.rarity}</span>
                      {formatDate(item.unlockedAt) && <span>{formatDate(item.unlockedAt)}</span>}
                    </span>
                  </span>
                  <span className="journal-entry-side">
                    <Icon name="bookmark" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <AnimatePresence>
        {selected && (
          <MemoryDetail item={selected} onClose={() => setSelected(null)} reduceMotion={shouldReduceMotion} />
        )}
      </AnimatePresence>
    </main>
  );
}

function MemoryDetail({ item, onClose, reduceMotion }) {
  const overlayTransition = reduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' };
  const bookTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] };

  return (
    <motion.div
      className="book-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Memory: ${item.title}`}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
    >
      <motion.div
        className="memory-book grain"
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotateX: 8 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotateX: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, rotateX: 6 }}
        transition={bookTransition}
        style={{ transformPerspective: 1200 }}
      >
        <button type="button" className="icon-button memory-close" onClick={onClose} aria-label="Close memory">
          <Icon name="check" />
        </button>

        <div className="memory-page">
          <div className="memory-image placeholder">
            <AnimatedCollectible collectible={item} preview />
          </div>
          <h4>Category</h4>
          <p>{item.category}</p>
        </div>

        <div className="memory-page">
          <h1>{item.title}</h1>
          <div className="memory-meta-grid">
            <span>Rarity<strong>{item.rarity}</strong></span>
            <span>Unlocked<strong>{formatDate(item.unlockedAt) || 'Unknown date'}</strong></span>
          </div>
          {item.caption && (
            <div className="memory-reflection">
              <h4>Reflection</h4>
              <p>{item.caption}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
