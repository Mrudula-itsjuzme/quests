import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { QuestDetail } from '../quests/QuestDetail';
import { questProgressRatio } from '../quests/QuestCard';
import { useActiveQuests, useMe } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { DashboardSkeleton } from '../../components/motion/SkeletonLoader';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';

export function DashboardPage() {
  const { data: me, isLoading: meLoading, isError: meError } = useMe();
  const { data: quests, isLoading: questsLoading } = useActiveQuests();
  const [selectedId, setSelectedId] = useState(null);

  const activeQuests = useMemo(() => quests || [], [quests]);
  const selected = activeQuests.find((quest) => quest.id === selectedId) || null;

  const isDashboardLoading = meLoading || questsLoading;

  return (
    <AnimatePresence mode="wait">
      {isDashboardLoading ? (
        <motion.main
          key="dashboard-skeleton"
          className="dashboard-reference"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.22 } }}
        >
          <DashboardSkeleton />
          <p className="sr-only" role="status">Loading your dashboard…</p>
        </motion.main>
      ) : meError ? (
        <motion.section
          key="dashboard-error"
          className="ornate-panel error-state"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Your dashboard could not be opened</h2>
          <p>Please check the quest service and try again.</p>
        </motion.section>
      ) : (
        <DashboardContent
          key="dashboard-content"
          me={me}
          activeQuests={activeQuests}
          selected={selected}
          setSelectedId={setSelectedId}
        />
      )}
    </AnimatePresence>
  );
}

function DashboardContent({
  me,
  activeQuests,
  selected,
  setSelectedId,
}) {
  const rankIndex = Math.max(0, Math.floor(((me?.totalXp) || 0) / 500));
  const rankNames = ['Novice I', 'Novice II', 'Novice III', 'Bronze I', 'Silver I', 'Gold I'];
  const rank = rankNames[Math.min(rankIndex, rankNames.length - 1)];
  const nextRankXp = (rankIndex + 1) * 500;

  return (
    <motion.main
      className="dashboard-reference dark-fantasy-dashboard"
      aria-label="Dashboard"
      variants={staggerContainer(0.06, 0.05)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } }}
    >
      <div className="dashboard-grid">
        {/* Left Column (Hero) */}
        <div className="dashboard-col-left">
          <motion.section className="hero-panorama" variants={staggerItem}>
            <div className="hero-content">
              <span className="hero-greeting">Good evening,</span>
              <h1>Adventurer.</h1>
              <p>"Small steps today, legend tomorrow."</p>
              <button className="continue-journey-btn" onClick={playTap}>
                Continue Journey <span>→</span>
              </button>
            </div>
            
            <div className="hero-stats-overlay">
              <div className="hero-stat-card">
                <Icon name="flame" className="text-gold" />
                <div>
                  <strong>{me.streakDays || 0}</strong>
                  <small>Day Streak</small>
                </div>
              </div>
              <div className="hero-stat-card">
                <Icon name="shield" className="text-silver" />
                <div>
                  <strong>{rank}</strong>
                  <small>{me.totalXp} / {nextRankXp} XP</small>
                </div>
              </div>
              <div className="hero-stat-card">
                <Icon name="compass" className="text-bronze" />
                <div>
                  <strong>{activeQuests.length}</strong>
                  <small>Active Quests</small>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Today's Quests (Bottom Left) */}
          <motion.section className="todays-quests-section" variants={staggerItem}>
            <div className="section-header">
              <h2><span className="diamond-bullet">✦</span> TODAY'S QUESTS</h2>
              <span className="reset-time">Reset at midnight <Icon name="moon" /></span>
            </div>
            
            <div className="quest-scroll-container">
              {activeQuests.slice(0, 4).map((quest) => (
                <div key={quest.id} className="parchment-card quest-card">
                  <div className="paperclip"></div>
                  <div className="quest-header">
                    <Icon name={categoryIcon(quest.category)} />
                    <h3>{quest.title}</h3>
                  </div>
                  <p className="quest-desc">{quest.description}</p>
                  
                  {quest.status === 'completed' ? (
                    <div className="quest-completed-stamp">
                      <div className="wax-seal">
                        <Icon name="check" />
                      </div>
                      <span>Completed</span>
                    </div>
                  ) : (
                    <div className="quest-progress-info">
                      <small>{quest.progressValue} / {quest.targetValue}</small>
                      <div className="parchment-progress">
                        <motion.div 
                          className="parchment-progress-fill" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${questProgressRatio(quest) * 100}%` }} 
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="quest-footer">
                    <span className="xp-reward">+{quest.xpReward} XP</span>
                    <div className={`checkbox ${quest.status === 'completed' ? 'checked' : ''}`}>
                      {quest.status === 'completed' && <Icon name="check" />}
                    </div>
                  </div>
                </div>
              ))}

              <button className="parchment-card add-quest-card" onClick={playTap}>
                <Icon name="plus" />
                <span>Add Quest</span>
                <div className="feather-pen"></div>
              </button>
            </div>
          </motion.section>
        </div>

        {/* Right Column (Side Panels) */}
        <div className="dashboard-col-right">
          <motion.section className="dark-glass-card path-card" variants={staggerItem}>
            <div className="section-header centered">
              <h2><span className="diamond-bullet">✦</span> YOUR PATH <span className="diamond-bullet">✦</span></h2>
            </div>
            <div className="path-rank-info">
              <Icon name="shield" className="large-shield" />
              <div>
                <h3>{rank}</h3>
                <small>{me.totalXp} / {nextRankXp} XP</small>
              </div>
            </div>
            
            <div className="path-map-container">
              <div className="path-nodes">
                <div className="path-node active"><div className="dot"></div><span>Village</span></div>
                <div className="path-node"><div className="dot"></div><span>Forest</span></div>
                <div className="path-node"><div className="dot"></div><span>Ruins</span></div>
                <div className="path-node"><div className="dot"></div><span>Capital</span></div>
                <div className="path-node"><div className="dot"></div><span>Dragon Peak</span></div>
                <div className="path-node locked"><Icon name="lock" /><span>Celestial Kingdom</span></div>
              </div>
            </div>
          </motion.section>

          <motion.section className="dark-glass-card bonus-chest-card" variants={staggerItem}>
            <div className="chest-info">
              <div className="section-header">
                <h2>DAILY BONUS CHEST <span className="diamond-bullet">✦</span></h2>
              </div>
              <p>Complete all active quests to unlock.</p>
              <strong className="xp-bonus">+150 XP</strong>
            </div>
            <div className="chest-image-container">
              <div className="magical-chest"></div>
            </div>
          </motion.section>

          <motion.section className="dark-glass-card encounter-card" variants={staggerItem}>
            <div className="section-header">
              <h2><span className="diamond-bullet">✦</span> RARE ENCOUNTER <span className="diamond-bullet">✦</span></h2>
            </div>
            <div className="encounter-content">
              <div className="encounter-info">
                <h3>Sunset Chaser</h3>
                <p>Capture today's most memorable moment.</p>
                <button className="encounter-btn" onClick={playTap}>
                  Begin <span>›</span>
                </button>
              </div>
              <div className="encounter-photo-frame">
                <div className="vintage-photo"></div>
                <div className="photo-paperclip"></div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Footer Bar */}
      <motion.footer className="dashboard-footer" variants={staggerItem}>
        <div className="footer-quote">
          <Icon name="feather" />
          <p>"Discipline is the bridge between goals and glory." <span>— Unknown</span></p>
        </div>
        <div className="footer-stats">
          <div className="footer-stat">
            <Icon name="shield" />
            <div><small>Level</small><strong>{rank}</strong></div>
          </div>
          <div className="footer-stat">
            <Icon name="star" />
            <div><small>XP</small><strong>{me.totalXp}</strong></div>
          </div>
          <div className="footer-stat">
            <Icon name="check" />
            <div><small>Quests Done</small><strong>{me.completedQuests || 23}</strong></div>
          </div>
          <div className="footer-stat">
            <Icon name="crown" />
            <div><small>Guild Rank</small><strong>—</strong></div>
          </div>
        </div>
      </motion.footer>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="quest-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} details`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={springConfig.snappy}
            >
              <button className="detail-close" type="button" onClick={() => { playTap(); setSelectedId(null); }} aria-label="Close quest details">×</button>
              <QuestDetail quest={selected} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}


