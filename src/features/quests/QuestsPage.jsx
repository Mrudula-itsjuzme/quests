import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { QuestDetail } from './QuestDetail';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { BottomSheet } from '../../components/motion/BottomSheet';
import { QuestSuccessModal } from '../../components/motion/QuestSuccessModal';
import {
  useActiveQuests,
  useMe,
} from './queries';

export function QuestsPage() {
  const activeQuery = useActiveQuests();
  const meQuery = useMe();

  const [tab, setTab] = useState('daily');
  const [selectedId, setSelectedId] = useState(null);
  const [completedQuestModal, setCompletedQuestModal] = useState(null);

  const quests = useMemo(() => {
    return activeQuery.data || [];
  }, [activeQuery.data]);

  const me = meQuery.data;

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
      {/* Top User Bar */}
      <div className="quest-user-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="quest-user-avatar">
            <img src="/assets/african-grey-parrot.png" alt="User Avatar" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: '800' }}>{me?.displayName || 'Sabareesh'}</h3>
            <small style={{ color: 'var(--wild-emerald)', fontSize: '0.72rem', fontWeight: '700' }}>
              Lv. 28 • 12,450 / 18,000 XP
            </small>
          </div>
        </div>
        <div className="quest-coin-badge">
          🪙 <span>3,250</span>
        </div>
      </div>

      {/* Season Hero Banner */}
      <div className="quest-season-hero" style={{ backgroundImage: 'url(/assets/verdant-explorer-banner.png)' }}>
        <div className="quest-season-content">
          <span className="quest-season-tag">Current Season</span>
          <h2 className="quest-season-title">VERDANT EXPLORER</h2>
          <span className="quest-time-left">⏳ 21d 14h left</span>
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
            No {tab} quests available right now. Check back later!
          </div>
        ) : (
          visibleQuests.map((quest) => {
            const isClaimable = quest.status === 'completed_unclaimed';
            const isDone = quest.status === 'completed';
            return (
              <motion.div
                key={quest.id}
                className={`quest-item-card ${isDone ? 'completed' : ''}`}
                whileHover={{ scale: 1.01 }}
                onClick={() => { playTap(); setSelectedId(quest.id); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="quest-item-emoji">{quest.icon || '📜'}</span>
                  <div style={{ flex: 1 }}>
                    <h4 className="quest-item-title">{quest.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <span className="quest-progress-num">{quest.progressText || '1 / 1'}</span>
                      <span className="quest-reward-pill">XP {quest.xpReward || 150}</span>
                      <span className="quest-reward-pill gold">🪙 {quest.coinReward || 50}</span>
                    </div>
                  </div>

                  {isClaimable ? (
                    <button
                      type="button"
                      className="quest-claim-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTap();
                        setCompletedQuestModal(quest);
                      }}
                    >
                      CLAIM
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quest-claim-btn glass"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTap();
                        setSelectedId(quest.id);
                      }}
                    >
                      View
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Season Progress Footer Card */}
      <div className="quest-season-progress-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="gold-hex-icon">🏆</div>
          <div>
            <small style={{ color: 'var(--wild-text-dim)', fontSize: '0.7rem' }}>SEASON PROGRESS</small>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>Gold Explorer</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--wild-gold)' }}>Tier III • 4,250 / 6,000 XP</span>
          </div>
        </div>
        <span style={{ fontSize: '1.8rem' }}>📦</span>
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


