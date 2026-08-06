import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [tab, setTab] = useState('daily');
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState('');
  const [deckIndex, setDeckIndex] = useState(0);

  const quests = useMemo(() => activeQuery.data || [], [activeQuery.data]);

  const visible = quests.filter((quest) => quest.cadence === tab);
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
          selected={selected}
          setSelectedId={setSelectedId}
          tab={tab}
          setTab={setTab}
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
  selected,
  setSelectedId,
  tab,
  setTab,
  notice,
  setNotice,
  deckIndex,
  setDeckIndex,

  generateDaily,
  generateWeekly,
  generateMonthly,
}) {
  const [completedQuestModal, setCompletedQuestModal] = useState(null);
  const cadences = useMemo(() => ([
    { id: 'daily', label: 'Daily', icon: 'sun', action: generateDaily },
    { id: 'weekly', label: 'Weekly', icon: 'star', action: generateWeekly },
    { id: 'monthly', label: 'Monthly', icon: 'compass', action: generateMonthly },
  ]), [generateDaily, generateWeekly, generateMonthly]);
  const activeCount = quests.filter((quest) => quest.status === 'active').length;
  const completedCount = quests.filter((quest) => quest.status === 'completed').length;
  const totalXpOnBoard = quests.reduce((sum, quest) => sum + (quest.xpReward || 0), 0);
  const deckQuests = visible.length ? visible : quests;
  const safeDeckIndex = Math.min(deckIndex, Math.max(deckQuests.length - 1, 0));

  useEffect(() => {
    const handleQuestCompleted = (event) => {
      setCompletedQuestModal(event.detail);
    };
    window.addEventListener('habbit-quest-completed', handleQuestCompleted);
    return () => window.removeEventListener('habbit-quest-completed', handleQuestCompleted);
  }, []);



  useEffect(() => {
    setDeckIndex(0);
  }, [tab, setDeckIndex]);

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
      <motion.header className="quest-command-hero" variants={staggerItem}>
        <div className="quest-hero-copy">
          <span className="quest-hero-kicker">Habbit Quest Board</span>
          <h1>Good morning, {me?.displayName || 'Wayfarer'}</h1>
          <p>Pick a path, clear the deck, and turn tiny rituals into visible progress.</p>
        </div>
        <div className="quest-hero-stats" aria-label="Quest progress summary">
          <span><strong>{activeCount}</strong><small>Active</small></span>
          <span><strong>{completedCount}</strong><small>Cleared</small></span>
          <span><strong>{totalXpOnBoard}</strong><small>Board XP</small></span>
        </div>
      </motion.header>

      {me && (
        <motion.section className="quest-status-panel ornate-panel" variants={staggerItem}>
          <div className="quest-status-level">
            <div className="xp-ring">
              <svg width="84" height="84">
                <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
                <circle cx="42" cy="42" r="38" fill="none" stroke="var(--quest-gold-bright)" strokeWidth="4" strokeDasharray="239" strokeDashoffset={239 - (me.progressToNextLevel * 239)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out', transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
              </svg>
              <span>{me.level}</span>
            </div>
            <div>
              <h2>Level {me.level}</h2>
              <p>{me.xpIntoLevel} / {me.xpForCurrentLevel} XP toward the next rank</p>
            </div>
          </div>
          <div className="quest-status-actions">
            {cadences.map((cadence) => (
              <button
                key={cadence.id}
                type="button"
                className={tab === cadence.id ? 'active' : ''}
                onClick={() => { playTap(); setTab(cadence.id); }}
                onMouseEnter={playHover}
              >
                <Icon name={cadence.icon} />
                <span>{cadence.label}</span>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <motion.div variants={staggerItem} style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--quest-cream)' }}>Quest Deck</h2>
        <p style={{ color: 'var(--quest-gold-dim)', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginTop: 4 }}>
          {cadences.find((item) => item.id === tab)?.label || 'Daily'} path <span style={{ opacity: 0.5 }}>·</span> {safeDeckIndex + 1}/{Math.max(deckQuests.length, 1)}
        </p>
      </motion.div>

      <motion.section className="swipe-deck-container" variants={staggerItem}>
        {deckQuests.length ? (
          <AnimatePresence mode="popLayout">
            {deckQuests.map((quest, index) => {
              if (index < deckIndex) return null; // Already swiped
              const isFront = index === deckIndex;
              const isSecond = index === deckIndex + 1;
              const scale = isFront ? 1 : isSecond ? 0.95 : 0.9;
              const y = isFront ? 0 : isSecond ? 20 : 40;
              const zIndex = 100 - index;
              
              return (
                <motion.div
                  key={quest.id}
                  className={`swipe-card rarity-${quest.rarity?.toLowerCase() || 'common'}`}
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
                       setSelectedId(quest.id);
                    } else if (info.offset.x < -100) {
                       playTap();
                       setDeckIndex(i => i + 1);
                    }
                  }}
                  whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                >
                  <div className="swipe-card-content">
                    <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                    <small>{quest.category} · {quest.rarity}</small>
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                    <div className="swipe-card-reward">
                      <strong>+{quest.xpReward} XP</strong>
                      <span>{quest.verificationType?.toLowerCase()} proof</span>
                    </div>
                  </div>
                  <div className="swipe-card-actions">
                    <button type="button" onClick={() => { playTap(); setDeckIndex(i => i + 1); }}>Skip</button>
                    <button type="button" onClick={() => { playTap(); setSelectedId(quest.id); }}>Open</button>
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
          <div className="swipe-card deck-empty-card">
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

      <AnimatePresence>
        {selected && (
          <BottomSheet isOpen={!!selected} onClose={() => { playTap(); setSelectedId(null); }}>
            <QuestDetail quest={selected} />
          </BottomSheet>
        )}
      </AnimatePresence>

      {createPortal(
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
        </AnimatePresence>,
        document.body,
      )}

      <AnimatePresence>
        {completedQuestModal && (
          <QuestSuccessModal
            quest={completedQuestModal.quest || completedQuestModal}
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
