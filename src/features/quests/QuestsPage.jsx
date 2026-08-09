import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { QuestDetail } from './QuestDetail';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { BottomSheet } from '../../components/motion/BottomSheet';
import { QuestSuccessModal } from '../../components/motion/QuestSuccessModal';
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
  const [completedQuestModal, setCompletedQuestModal] = useState(null);

  const quests = useMemo(() => activeQuery.data || [], [activeQuery.data]);
  const me = meQuery.data;

  const visibleQuests = useMemo(
    () => quests.filter((q) => !tab || q.cadence === tab),
    [quests, tab],
  );

  const selected = quests.find((q) => q.id === selectedId) || null;

  useEffect(() => {
    const handleQuestCompleted = (event) => {
      setCompletedQuestModal(event.detail);
    };
    window.addEventListener('habbit-quest-completed', handleQuestCompleted);
    return () => window.removeEventListener('habbit-quest-completed', handleQuestCompleted);
  }, []);

  return (
    <main className="quests-shell">
      {/* Header */}
      <div className="quests-header">
        <h1>QUESTS</h1>
      </div>

      {/* Season Hero Banner */}
      <div className="quest-season-hero" style={{ backgroundImage: 'url(/assets/verdant-explorer-banner.png)' }}>
        <div className="quest-season-content">
          <span className="quest-season-tag">SEASON PASS • ENDS IN 12 DAYS</span>
          <h2 className="quest-season-title">VERDANT EXPLORER</h2>
          <div className="quest-season-progress">
            <div className="quest-season-bar" style={{ width: '45%' }} />
          </div>
          <p className="quest-season-sub">Tier 14 / 30 • Next reward: S-Rank Mystery Chest 🎁</p>
        </div>
      </div>

      {/* Cadence Filter Tabs */}
      <div className="quest-cadence-tabs">
        <button
          type="button"
          className={`quest-cadence-btn ${tab === 'daily' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('daily'); }}
        >
          Daily Quests
        </button>
        <button
          type="button"
          className={`quest-cadence-btn ${tab === 'weekly' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('weekly'); }}
        >
          Weekly Expeditions
        </button>
        <button
          type="button"
          className={`quest-cadence-btn ${tab === 'monthly' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('monthly'); }}
        >
          Monthly Trials
        </button>
      </div>

      {/* Quests Card List */}
      <div className="quests-card-list">
        {visibleQuests.map((quest) => {
          const isDone = quest.status === 'completed';
          return (
            <motion.div
              key={quest.id}
              className={`quest-item-card ${isDone ? 'completed' : ''}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => { playTap(); setSelectedId(quest.id); }}
            >
              <div className="quest-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="scroll" />
                  <span className="quest-item-category">{quest.category || 'Exploration'}</span>
                </div>
                <span className="quest-item-xp">+{quest.xpReward || 250} XP</span>
              </div>

              <h3 className="quest-item-title">{quest.title}</h3>
              <p className="quest-item-desc">{quest.description}</p>

              <div className="quest-item-footer">
                <span className="quest-item-proof">Proof: {quest.verificationType || 'Photo'}</span>
                <button
                  type="button"
                  className={isDone ? 'quest-claim-btn done' : 'quest-claim-btn'}
                  onClick={(e) => {
                    e.stopPropagation();
                    playTap();
                    setSelectedId(quest.id);
                  }}
                >
                  {isDone ? 'Claimed ✓' : 'Complete Quest'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Quest Modal Sheet */}
      <AnimatePresence>
        {selected && (
          <BottomSheet isOpen={!!selected} onClose={() => setSelectedId(null)}>
            <QuestDetail quest={selected} />
          </BottomSheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completedQuestModal && (
          <QuestSuccessModal
            quest={completedQuestModal.quest || completedQuestModal}
            onClose={() => setCompletedQuestModal(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

