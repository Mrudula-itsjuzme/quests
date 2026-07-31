import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { QuestDetail } from './QuestDetail';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { QuestsSkeleton } from '../../components/motion/SkeletonLoader';
import { IntentionalEmptyState } from '../../components/motion/EmptyState';
import { QuestSuccessModal } from '../../components/motion/QuestSuccessModal';
import { BottomSheet } from '../../components/motion/BottomSheet';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';
import {
  useActiveQuests,
  useGenerateDaily,
  useGenerateMonthly,
  useGenerateWeekly,
  useMe,
} from './queries';



export function QuestsPage() {
  const activeQuery = useActiveQuests();
  const meQuery = useMe();

  const generateDaily = useGenerateDaily();
  const generateWeekly = useGenerateWeekly();
  const generateMonthly = useGenerateMonthly();
  const [tab] = useState('daily');
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState('');
  const [deckIndex, setDeckIndex] = useState(0);

  const quests = useMemo(() => activeQuery.data || [], [activeQuery.data]);

  const visible = quests.filter((quest) => quest.cadence === tab);
  const featured = visible[0] || quests[0] || null;
  const selected = quests.find((quest) => quest.id === selectedId) || null;

  const isQuestsLoading = activeQuery.isLoading || meQuery.isLoading;

  return (
    <AnimatePresence mode="wait">
      {isQuestsLoading ? (
        <motion.main
          key="quests-skeleton"
          className="quest-reference"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.22 } }}
        >
          <QuestsSkeleton />
          <p className="sr-only" role="status">Loading your quest journal…</p>
        </motion.main>
      ) : (activeQuery.isError || meQuery.isError) ? (
        <motion.section
          key="quests-error"
          className="ornate-panel error-state"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>The quest board is veiled</h2>
          <p>We could not reach your quest service. Check your connection and try again.</p>
        </motion.section>
      ) : (
        <QuestsContent
          key="quests-content"
          me={meQuery.data}
          quests={quests}
          visible={visible}
          featured={featured}
          selected={selected}
          setSelectedId={setSelectedId}
          tab={tab}
          notice={notice}
          setNotice={setNotice}
          deckIndex={deckIndex}
          setDeckIndex={setDeckIndex}

          generateDaily={generateDaily}
          generateWeekly={generateWeekly}
          generateMonthly={generateMonthly}
        />
      )}
    </AnimatePresence>
  );
}

function QuestsContent({
  me,
  quests,
  visible,
  featured,
  selected,
  setSelectedId,
  tab,
  notice,
  setNotice,
  deckIndex,
  setDeckIndex,

  generateDaily,
  generateWeekly,
  generateMonthly,
}) {
  const [completedQuestModal, setCompletedQuestModal] = useState(null);

  useEffect(() => {
    const handleQuestCompleted = (event) => {
      setCompletedQuestModal(event.detail);
    };
    window.addEventListener('habbit-quest-completed', handleQuestCompleted);
    return () => window.removeEventListener('habbit-quest-completed', handleQuestCompleted);
  }, []);



  const hasCadence = (cadence) => quests.some((quest) => quest.cadence === cadence);
  const accept = (cadence) => {
    playTap();
    const mutation = cadence === 'monthly' ? generateMonthly : cadence === 'weekly' ? generateWeekly : generateDaily;
    if (hasCadence(cadence)) {
      setNotice(`Your ${cadence} quests are already active.`);
      return;
    }
    mutation.mutate(undefined, {
      onSuccess: () => setNotice(`${cadence === 'monthly' ? 'Monthly expedition' : cadence === 'weekly' ? 'Weekly quest' : 'Daily quests'} accepted.`),
      onError: () => setNotice('The quest could not be accepted. Please try again.'),
    });
  };

  return (
    <motion.main
      className="quest-reference fantasy-page"
      aria-label="Mobile Home Dashboard"
      variants={staggerContainer(0.05, 0.04)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } }}
    >
      <motion.header className="mobile-home-header" variants={staggerItem}>
        <h1>Good morning, Wayfarer</h1>
        <p>Your path awaits.</p>
      </motion.header>

      {me && (
        <motion.section className="mobile-today-summary ornate-panel" style={{ marginBottom: 24 }} variants={staggerItem}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="xp-ring">
              <svg width="84" height="84">
                <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
                <circle cx="42" cy="42" r="38" fill="none" stroke="var(--quest-gold-bright)" strokeWidth="4" strokeDasharray="239" strokeDashoffset={239 - (me.progressToNextLevel * 239)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out', transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
              </svg>
              <span>{me.level}</span>
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--quest-gold-bright)' }}>Level {me.level}</h2>
              <p style={{ margin: 0, color: 'var(--quest-muted)' }}>{me.xpIntoLevel} / {me.xpForCurrentLevel} XP</p>
            </div>
          </div>
        </motion.section>
      )}

      {featured && (
        <motion.section className="ornate-panel" style={{ marginBottom: 24, padding: 24, borderRadius: 24 }} variants={staggerItem}>
          <div style={{ display: 'flex', gap: 8, color: 'var(--quest-gold-bright)', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: 8 }}>
            <Icon name="star" /> <strong>Today's Mission</strong>
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: 4 }}>{featured.title}</h2>
          <p style={{ color: 'var(--quest-muted)' }}>{featured.description}</p>
        </motion.section>
      )}

      <motion.div variants={staggerItem} style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--quest-cream)' }}>Quest Deck</h2>
      </motion.div>

      <motion.section className="swipe-deck-container" variants={staggerItem}>
        {visible.length ? (
          <AnimatePresence mode="popLayout">
            {visible.map((quest, index) => {
              if (index < deckIndex) return null; // Already swiped
              const isFront = index === deckIndex;
              const isSecond = index === deckIndex + 1;
              const scale = isFront ? 1 : isSecond ? 0.95 : 0.9;
              const y = isFront ? 0 : isSecond ? 20 : 40;
              const zIndex = 100 - index;
              
              return (
                <motion.div
                  key={quest.id}
                  className="swipe-card"
                  style={{ zIndex }}
                  initial={{ scale: 0.8, opacity: 0, y: 100 }}
                  animate={{ scale, opacity: 1, y }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={springConfig.tactile}
                  drag={isFront ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(event, info) => {
                    if (info.offset.x > 100) {
                       playTap();
                       setDeckIndex(i => i + 1);
                       // Dispatch complete event internally to trigger success overlay/Wax Seal
                       window.dispatchEvent(new CustomEvent('habbit-quest-completed', { detail: quest }));
                    } else if (info.offset.x < -100) {
                       playTap();
                       setDeckIndex(i => i + 1);
                    }
                  }}
                  whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                >
                  <div className="swipe-card-content">
                    <span className="round-emblem" style={{ marginBottom: 16 }}><Icon name={categoryIcon(quest.category)} /></span>
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                    <div style={{ marginTop: 24 }}>
                      <strong style={{ color: 'var(--quest-gold-bright)' }}>+{quest.xpReward} XP</strong>
                    </div>
                  </div>
                  <div className="swipe-card-actions">
                    <span style={{ color: '#F44336' }}>‹ Skip</span>
                    <span style={{ color: '#4CAF50' }}>Complete ›</span>
                  </div>
                </motion.div>
              );
            })}
            {deckIndex >= visible.length && (
              <div className="swipe-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <Icon name="check" />
                  <h3>All Caught Up</h3>
                  <p>You have completed all quests in this deck.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        ) : (
          <div className="swipe-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <IntentionalEmptyState
              icon="scroll"
              title={`No ${tab} quests yet`}
              description="Generate a new set to begin this path."
              actionLabel={`Generate ${tab} quests`}
              onAction={() => accept(tab)}
            />
          </div>
        )}
      </motion.section>
      {/* Removed desktop quest grids and tabs */}

      <AnimatePresence>
        {selected && (
          <BottomSheet isOpen={!!selected} onClose={() => { playTap(); setSelectedId(null); }}>
            <QuestDetail quest={selected} />
          </BottomSheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast-notice"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={springConfig.snappy}
          >
            <span>{notice}</span>
            <button type="button" onClick={() => { playTap(); setNotice(''); }} aria-label="Dismiss notification">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completedQuestModal && (
          <QuestSuccessModal
            quest={completedQuestModal.quest}
            onClose={() => setCompletedQuestModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}

export function PlayerHeader({ me, page }) {
  return (
    <header className="reference-header">
      <motion.div className="avatar-medallion" whileHover={{ scale: 1.08, rotate: 3 }} onMouseEnter={playHover} transition={springConfig.tactile}>
        <span>{(me.displayName || 'S')[0].toUpperCase()}</span><b>{me.level}</b>
      </motion.div>
      <div className="player-heading">
        <h1>{page}</h1>
        <p>{me.displayName || 'Mind in progress'} <i /></p>
        <span><Icon name="shield" /> <AnimatedCounter value={me.totalXp} /> XP</span>
      </div>
      <div className="header-orbit">
        <motion.button type="button" aria-label="Notifications" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => { playTap(); window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'No new notices. Your path is clear.' })); }}>
          <Icon name="bell" />
        </motion.button>
        <motion.button type="button" aria-label="Open path compass" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => { playTap(); window.dispatchEvent(new CustomEvent('habbit-notice', { detail: `Your current path rank is ${me.tier || 'Novice'}.` })); }}>
          <Icon name="compass" />
        </motion.button>
      </div>
    </header>
  );
}

