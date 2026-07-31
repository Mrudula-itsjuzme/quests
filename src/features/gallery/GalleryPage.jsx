import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedCollectible } from '../../components/AnimatedCollectible';
import { Icon, categoryColors, categoryIcon } from '../../components/Icon';
import { useCollectibles } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { PhysicalCard } from '../../components/motion/PhysicalCard';
import { GallerySkeleton } from '../../components/motion/SkeletonLoader';
import { IntentionalEmptyState } from '../../components/motion/EmptyState';
import { BottomSheet } from '../../components/motion/BottomSheet';
import { calmStaggerContainer, calmFade } from '../../components/motion/MotionVariants';

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


  const filtered = useMemo(
    () => (collection || []).filter((item) => filter === 'all' || item.category === filter),
    [collection, filter],
  );

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.main
          key="gallery-skeleton"
          className="gallery-shell page-stack fantasy-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.22 } }}
        >
          <GallerySkeleton />
          <p className="sr-only" role="status">Loading your journal gallery…</p>
        </motion.main>
      ) : isError ? (
        <motion.section
          key="gallery-error"
          className="ornate-panel error-state"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Your gallery is currently unreachable</h2>
          <p>Please check your connection and try again.</p>
        </motion.section>
      ) : (
        <GalleryContent
          key="gallery-content"
          collection={collection || []}
          filtered={filtered}
          filter={filter}
          setFilter={setFilter}
          selected={selected}
          setSelected={setSelected}
        />
      )}
    </AnimatePresence>
  );
}

function GalleryContent({
  collection,
  filtered,
  filter,
  setFilter,
  selected,
  setSelected,
}) {

  return (
    <motion.main
      className="gallery-shell page-stack fantasy-page"
      variants={calmStaggerContainer(0.06, 0.04)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.4 } }}
    >
      <motion.div className="page-heading" variants={calmFade}>
        <div>
          <h1>Gallery</h1>
          <p>A chronological journal of every milestone unlocked during your quest journey.</p>
        </div>
      </motion.div>

      {!collection || collection.length === 0 ? (
        <motion.div variants={calmFade}>
          <IntentionalEmptyState
            icon="star"
            title="No stickers unlocked yet"
            description="Complete verified daily or campaign quests to earn your first collectible badge."
          />
        </motion.div>
      ) : (
        <motion.section className="panel ornate-panel" aria-label="Memory journal" variants={calmFade}>
          <div className="segmented-control" role="group" aria-label="Filter memories by category">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? 'active' : ''}
                onClick={() => {
                  playTap();
                  setFilter(item.id);
                }}
                onMouseEnter={playHover}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="empty-state">No unlocked artifacts in this category yet.</p>
          ) : (
            <div className="journal-timeline">
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div 
                    variants={calmFade} 
                    key={item.assetId} 
                    layout
                    style={{ position: 'relative', marginBottom: '8px' }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: '#F44336', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '24px', color: 'white' }}>
                      <Icon name="archive" />
                    </div>
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={{ left: 0.8, right: 0 }}
                      onDragEnd={(e, info) => {
                        if (info.offset.x < -100) {
                          // Trigger archive
                          playTap();
                          // Simulating an archive action since no API exists yet
                          setFilter(filter); // Force re-render just to trigger something
                        }
                      }}
                      whileDrag={{ scale: 1.02 }}
                    >
                      <PhysicalCard
                        className="journal-entry-card"
                        onClick={() => {
                          playTap();
                          setSelected(item);
                        }}
                      >
                        <div className="journal-entry-content">
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
                        </div>
                      </PhysicalCard>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      )}

      <AnimatePresence>
        {selected && (
          <BottomSheet isOpen={!!selected} onClose={() => { playTap(); setSelected(null); }}>
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ margin: '0 auto 24px', width: '120px', height: '120px' }}>
                <AnimatedCollectible collectible={selected} preview />
              </div>
              <h2 style={{ fontSize: '2rem', color: 'var(--quest-gold-bright)', marginBottom: '8px' }}>{selected.title}</h2>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                <span className={`pill ${categoryColors[selected.category] || ''}`}>{selected.category}</span>
                <span className="pill" style={{ background: 'rgba(255,255,255,0.1)' }}>{selected.rarity}</span>
              </div>
              {selected.caption && (
                <p style={{ color: 'var(--quest-muted)', fontSize: '1.1rem', fontStyle: 'italic', padding: '0 24px' }}>"{selected.caption}"</p>
              )}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

