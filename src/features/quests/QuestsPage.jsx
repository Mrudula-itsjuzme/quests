import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QuestDetail } from './QuestDetail';
import { playTap } from '../../lib/useSoundEffects';
import { BottomSheet } from '../../components/motion/BottomSheet';
import { QuestSuccessModal } from '../../components/motion/QuestSuccessModal';
import { deriveGold } from '../../lib/playerEconomy';
import {
  useActiveQuests,
  useGenerateDaily,
  useGenerateWeekly,
  useGenerateMonthly,
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
  const [completedQuestModal, setCompletedQuestModal] = useState(null);

  const quests = useMemo(() => {
    return activeQuery.data || [];
  }, [activeQuery.data]);

  const me = meQuery.data;
  const gold = deriveGold(me?.totalXp);

  const visibleQuests = useMemo(
    () => quests.filter((q) => !tab || (q.cadence && q.cadence.toLowerCase() === tab.toLowerCase())),
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
      <h1 className="sr-only">Quests</h1>
      {/* Top User Bar */}
      <div className="quest-user-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="quest-user-avatar">
            <img src="/assets/african-grey-parrot.png" alt="User Avatar" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: '800' }}>{me?.displayName || 'Adventurer'}</h3>
            {me && (
              <small style={{ color: 'var(--wild-emerald)', fontSize: '0.72rem', fontWeight: '700' }}>
                {me.tier} {me.level} • {me.xpIntoLevel} / {me.xpForCurrentLevel} XP
              </small>
            )}
          </div>
        </div>
        <div className="quest-coin-badge">
          🪙 <span>{gold.toLocaleString()}</span>
        </div>
      </div>

      {/* Cadence Filter Tabs */}
      <div className="quest-cadence-tabs" style={{ position: 'relative' }}>
        {['daily', 'weekly', 'monthly'].map((t) => {
          const isActive = tab === t;
          return (
            <motion.button
              key={t}
              type="button"
              className={`quest-cadence-btn ${isActive ? 'active' : ''}`}
              onClick={() => { playTap(); setTab(t); }}
              whileTap={{ scale: 0.95 }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {isActive && (
                <motion.div
                  layoutId="quests-tab-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--quest-surface)',
                    borderRadius: '8px',
                    zIndex: -1,
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 2 }}>{t.toUpperCase()}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Quests List */}
      <div className="quests-card-list">
        {activeQuery.isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wild-text-dim)' }}>Loading quests...</div>
        ) : visibleQuests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--wild-text-dim)' }}>
            <p>No {tab} quests yet.</p>
            <motion.button
              type="button"
              className="continue-journey-btn"
              style={{ marginTop: '12px' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                playTap();
                if (tab === 'daily') generateDaily.mutate();
                else if (tab === 'weekly') generateWeekly.mutate();
                else generateMonthly.mutate();
              }}
            >
              Generate {tab} quests <span>→</span>
            </motion.button>
          </div>
        ) : (
          visibleQuests.map((quest) => {
            const isDone = quest.status === 'completed';
            return (
              <motion.div
                key={quest.id}
                className={`quest-item-card ${isDone ? 'completed' : ''}`}
                whileHover={{ scale: 1.01 }}
                onClick={() => { playTap(); setSelectedId(quest.id); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="quest-item-emoji">📜</span>
                  <div style={{ flex: 1 }}>
                    <h4 className="quest-item-title">{quest.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <span className="quest-progress-num">{quest.progressValue}/{quest.targetValue} {quest.unit}</span>
                      <span className="quest-reward-pill">XP {quest.xpReward}</span>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div
                        key="done"
                        initial={{ scale: 0, opacity: 0, rotate: -45 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="quest-claim-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--quest-gold-dim)', color: 'var(--quest-gold-bright)' }}
                      >
                        ✔
                      </motion.div>
                    ) : (
                      <motion.button
                        key="claim"
                        initial={{ opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        type="button"
                        className="quest-claim-btn glass"
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTap();
                          setSelectedId(quest.id);
                        }}
                      >
                        View
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
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


