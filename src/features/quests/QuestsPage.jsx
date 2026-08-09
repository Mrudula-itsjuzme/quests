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

const SAMPLE_QUESTS = [
  {
    id: 'q1',
    title: 'Photograph 3 Different Birds',
    description: 'Capture distinct bird species in your area',
    progressText: '2 / 3',
    xpReward: 150,
    coinReward: 50,
    status: 'in_progress',
    cadence: 'daily',
    icon: '🦜',
  },
  {
    id: 'q2',
    title: 'Discover a Waterfall',
    description: 'Find and photograph a landscape waterfall point',
    progressText: '0 / 1',
    xpReward: 200,
    coinReward: 75,
    status: 'in_progress',
    cadence: 'daily',
    icon: '🌊',
  },
  {
    id: 'q3',
    title: 'Find a Red Flower',
    description: 'Capture a vibrant red flora specimen',
    progressText: '1 / 1',
    xpReward: 100,
    coinReward: 50,
    status: 'completed_unclaimed',
    cadence: 'daily',
    icon: '🌺',
  },
  {
    id: 'q4',
    title: 'Explore for 30 Minutes',
    description: 'Track outdoor walking time in nature',
    progressText: '18 / 30',
    xpReward: 120,
    coinReward: 50,
    status: 'in_progress',
    cadence: 'daily',
    icon: '🧭',
  },
];

export function QuestsPage() {
  const activeQuery = useActiveQuests();
  const meQuery = useMe();

  const [tab, setTab] = useState('daily');
  const [selectedId, setSelectedId] = useState(null);
  const [completedQuestModal, setCompletedQuestModal] = useState(null);

  const quests = useMemo(() => {
    const fetched = activeQuery.data || [];
    return fetched.length > 0 ? fetched : SAMPLE_QUESTS;
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
      <div className="quest-cadence-tabs">
        <button
          type="button"
          className={`quest-cadence-btn ${tab === 'daily' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('daily'); }}
        >
          DAILY
        </button>
        <button
          type="button"
          className={`quest-cadence-btn ${tab === 'weekly' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('weekly'); }}
        >
          WEEKLY
        </button>
        <button
          type="button"
          className={`quest-cadence-btn ${tab === 'monthly' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('monthly'); }}
        >
          MONTHLY
        </button>
      </div>

      {/* Quests List */}
      <div className="quests-card-list">
        {visibleQuests.map((quest) => {
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
        })}
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


