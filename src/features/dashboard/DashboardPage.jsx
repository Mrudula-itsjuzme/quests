import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { QuestDetail } from '../quests/QuestDetail';
import { questProgressRatio } from '../quests/QuestCard';
import { useActiveQuests, useCollectibles, useMarkNotificationRead, useMe, useNotifications, useQuestHistory } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { DashboardSkeleton } from '../../components/motion/SkeletonLoader';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';
import { deriveGold, deriveGems, getEnergy } from '../../lib/playerEconomy';
import { PhysicalCard } from '../../components/motion/PhysicalCard';
import { ParallaxLayer } from '../../components/motion/ParallaxLayer';
import { nextBestAction } from '../../lib/nextBestAction';

const REALMS = [
  { key: 'Mind', label: 'Mind', tiers: ['Novice', 'Apprentice', 'Scholar', 'Sage'], icon: 'leaf' },
  { key: 'Body', label: 'Body', tiers: ['Novice', 'Wayfarer', 'Vanguard', 'Warden'], icon: 'bolt' },
  { key: 'Discovery', label: 'Discovery', tiers: ['Novice', 'Seeker', 'Ranger', 'Pathfinder'], icon: 'compass' },
];

function realmMastery(activeQuests = [], realmKey) {
  const safeQuests = Array.isArray(activeQuests) ? activeQuests : [];
  const realmQuests = safeQuests.filter((quest) => quest.category === realmKey);
  const completed = realmQuests.filter((quest) => quest.status === 'completed');
  const earnedXp = completed.reduce((sum, quest) => sum + (quest.xpReward || 0), 0);
  const tierIndex = Math.min(3, Math.floor(earnedXp / 150));
  const tierFloor = tierIndex * 150;
  const progress = tierIndex === 3 ? 1 : (earnedXp - tierFloor) / 150;
  return { earnedXp, tierIndex, progress: Math.max(0, Math.min(1, progress)) };
}

export function DashboardPage() {
  const { data: me, isLoading: meLoading, isError: meError } = useMe();
  const { data: quests, isLoading: questsLoading } = useActiveQuests();
  const { data: collectibles } = useCollectibles();
  const { data: notifications } = useNotifications();
  const { data: history } = useQuestHistory();
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
          collectibles={collectibles || []}
          notifications={notifications || []}
          questsCompleted={(history || []).filter((q) => q.status === 'completed').length}
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
  collectibles,
  notifications,
  questsCompleted,
  selected,
  setSelectedId,
}) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();

  // Level/tier/XP-to-next come straight from the server's progression engine
  // (calculateProgression) — never recomputed client-side.
  const rank = `${me.tier} ${me.level}`;
  const xpIntoLevel = me.xpIntoLevel ?? 0;
  const xpForCurrentLevel = me.xpForCurrentLevel ?? 1;

  const gold = deriveGold(me?.totalXp);
  const gems = deriveGems(collectibles);
  const energy = getEnergy();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.readAt), [notifications]);
  const latestUnread = unreadNotifications[0] || null;

  const suggestedActions = useMemo(
    () => nextBestAction({ activeQuests, notifications, streakDays: me.streakDays || 0 }),
    [activeQuests, notifications, me.streakDays],
  );

  const notify = (detail) => window.dispatchEvent(new CustomEvent('habbit-notice', { detail }));

  return (
    <motion.main
      className="dashboard-reference dark-fantasy-dashboard"
      aria-label="Dashboard"
      variants={staggerContainer(0.06, 0.05)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } }}
    >
      <h1 className="sr-only">Dashboard</h1>

      {/* Mobile-only RPG home screen */}
      <section className="mobile-home-screen" aria-label="Adventurer home">
        <div className="mobile-home-topbar">
          <div className="mobile-home-identity">
            <div className="mobile-home-avatar">
              <span>{(me.displayName || 'S')[0].toUpperCase()}</span>
              <b>{me.level}</b>
            </div>
            <div>
              <strong>{me.displayName || 'Adventurer'}</strong>
              <small>{rank}</small>
            </div>
          </div>
          <div className="mobile-home-stats">
            <div className="mobile-home-pill">
              <Icon name="bolt" />
              <span>{energy.value}/{energy.max}</span>
            </div>
            <div className="mobile-home-pill">
              <Icon name="coin" />
              <span>{gold.toLocaleString()}</span>
            </div>
            <div className="mobile-home-pill">
              <Icon name="gem" />
              <span>{gems.toLocaleString()}</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-home-bell"
            aria-label={unreadNotifications.length > 0 ? `${unreadNotifications.length} unread notifications` : 'Notifications'}
            onClick={() => {
              playTap();
              if (latestUnread) {
                notify(latestUnread.body || latestUnread.title);
                markRead.mutate(latestUnread.id);
              } else {
                notify('No new notices. Your path is clear.');
              }
            }}
          >
            <Icon name="bell" />
            {unreadNotifications.length > 0 && <span className="mobile-home-bell-dot" aria-hidden="true" />}
          </button>
        </div>

        <div className="mobile-home-banner">
          <div className="mobile-home-banner-copy">
            <span className="mobile-home-greeting">{greeting},</span>
            <h2>Adventurer.</h2>
            <p>&ldquo;Small steps today, legend tomorrow.&rdquo;</p>
            <button type="button" className="continue-journey-btn" onClick={() => { playTap(); navigate('/app/quests'); }}>
              Continue Journey <span>→</span>
            </button>
          </div>
        </div>

        <div className="mobile-home-statrow">
          <div className="mobile-home-stat">
            <Icon name="flame" className="text-gold" />
            <div>
              <strong>{me.streakDays || 0}</strong>
              <small>Day Streak</small>
            </div>
          </div>
          <div className="mobile-home-stat">
            <Icon name="shield" className="text-silver" />
            <div>
              <strong>{rank}</strong>
              <small>{xpIntoLevel} / {xpForCurrentLevel} XP</small>
            </div>
          </div>
          <div className="mobile-home-stat">
            <Icon name="compass" className="text-bronze" />
            <div>
              <strong>{activeQuests.length}</strong>
              <small>Active Quests</small>
            </div>
          </div>
        </div>

        <div className="mobile-home-section">
          <div className="section-header">
            <h2><span className="diamond-bullet">✦</span> TODAY&apos;S QUESTS</h2>
            <span className="reset-time">Reset at midnight <Icon name="moon" /></span>
          </div>
          <div className="mobile-home-quest-list">
            {activeQuests.slice(0, 4).map((quest) => {
              const ratio = questProgressRatio(quest);
              const isCompleted = quest.status === 'completed';
              return (
                <button
                  key={quest.id}
                  type="button"
                  className="mobile-home-quest-row"
                  onClick={() => { playTap(); setSelectedId(quest.id); }}
                >
                  <div className="mobile-home-quest-icon">
                    <Icon name={categoryIcon(quest.category)} />
                  </div>
                  <div className="mobile-home-quest-copy">
                    <strong>{quest.title}</strong>
                    <small>{quest.description}</small>
                    {!isCompleted && (
                      <div className="mobile-home-quest-progress">
                        <div style={{ width: `${ratio * 100}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="mobile-home-quest-reward">
                    <span className="xp-pill"><Icon name="star" />{quest.xpReward}</span>
                    <span className="gold-pill"><Icon name="coin" />{Math.round(quest.xpReward / 5)}</span>
                    <Icon name={isCompleted ? 'check' : 'compass'} className={isCompleted ? 'text-gold' : 'chevron'} />
                  </div>
                </button>
              );
            })}
            {activeQuests.length === 0 && (
              <p className="mobile-home-empty">No active quests. Visit the Quest board to start one.</p>
            )}
          </div>
          <button type="button" className="mobile-home-view-all" onClick={() => { playTap(); navigate('/app/quests'); }}>
            View All Quests <Icon name="compass" />
          </button>
        </div>

        <nav className="mobile-home-navgrid" aria-label="Quick links">
          {[
            { label: 'Sanctuary', icon: 'home', to: '/app/guild' },
            { label: 'Journal', icon: 'book', to: '/app/profile' },
            { label: 'Codex', icon: 'scroll', to: '/app/gallery' },
            { label: 'Achievements', icon: 'star', to: '/app/profile' },
            { label: 'Inbox', icon: 'bell', to: '/app/guild' },
            { label: 'Shop', icon: 'chest', to: '/app/rewards' },
          ].map((item) => (
            <button key={item.label} type="button" onClick={() => { playTap(); navigate(item.to); }}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </section>

      <div className="dashboard-grid dashboard-grid-desktop">
        {/* Left Column (Hero) */}
        <div className="dashboard-col-left">
          <motion.section className="hero-panorama" variants={staggerItem}>
            <ParallaxLayer depth={10} className="hero-panorama-parallax">
              <div className="hero-content">
                <span className="hero-greeting">{greeting},</span>
                <h1>Adventurer.</h1>
                <p>"Small steps today, legend tomorrow."</p>
                <button className="continue-journey-btn" onClick={() => { playTap(); navigate('/app/quests'); }}>
                  Continue Journey <span>→</span>
                </button>
              </div>
            </ParallaxLayer>

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
                  <small>{xpIntoLevel} / {xpForCurrentLevel} XP</small>
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
              {activeQuests.slice(0, 4).map((quest) => {
                const isCompleted = quest.status === 'completed';
                const realmClass = quest.category ? quest.category.toLowerCase() : '';
                return (
                  <PhysicalCard
                    key={quest.id}
                    className={`quest-realm-card ${realmClass} ${isCompleted ? 'is-completed' : ''}`}
                    onClick={() => { playTap(); setSelectedId(quest.id); }}
                    maxTilt={6}
                  >
                    <div className="quest-realm-header">
                      <span className="quest-realm-icon"><Icon name={categoryIcon(quest.category)} /></span>
                      <h3>{quest.title}</h3>
                    </div>
                    <p className="quest-realm-desc">{quest.description}</p>

                    {isCompleted ? (
                      <div className="quest-realm-completed">
                        <span className="quest-realm-check"><Icon name="check" /></span>
                        <span>Completed</span>
                      </div>
                    ) : (
                      <div className="quest-realm-progress-info">
                        <small>{quest.progressValue} / {quest.targetValue}</small>
                        <div className="quest-realm-progress">
                          <motion.div
                            className="quest-realm-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${questProgressRatio(quest) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="quest-realm-footer">
                      <span className="xp-reward">+{quest.xpReward} XP</span>
                      <div className={`checkbox ${isCompleted ? 'checked' : ''}`}>
                        {isCompleted && <Icon name="check" />}
                      </div>
                    </div>
                  </PhysicalCard>
                );
              })}

              <button className="quest-realm-card add-quest-card" onClick={() => { playTap(); navigate('/app/quests'); }}>
                <Icon name="plus" />
                <span>Add Quest</span>
              </button>
            </div>
          </motion.section>
        </div>

        {/* Right Column (Side Panels) */}
        <div className="dashboard-col-right">
          <motion.section className="dark-glass-card realm-mastery-card" variants={staggerItem}>
            <div className="section-header centered">
              <h2><span className="diamond-bullet">✦</span> REALM MASTERY <span className="diamond-bullet">✦</span></h2>
            </div>

            <div className="realm-mastery-list">
              {REALMS.map((realm) => {
                const mastery = realmMastery(activeQuests, realm.key);
                const tierName = realm.tiers[mastery.tierIndex];
                return (
                  <div key={realm.key} className={`realm-mastery-row ${realm.key.toLowerCase()}`}>
                    <span className="realm-mastery-icon"><Icon name={realm.icon} /></span>
                    <div className="realm-mastery-copy">
                      <div className="realm-mastery-label">
                        <strong>{realm.label}</strong>
                        <span>{tierName}</span>
                      </div>
                      <div className="realm-mastery-bar">
                        <motion.div
                          className="realm-mastery-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${mastery.progress * 100}%` }}
                          transition={springConfig.soft}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section className="dark-glass-card up-next-card" variants={staggerItem}>
            <div className="section-header">
              <h2><span className="diamond-bullet">✦</span> UP NEXT</h2>
            </div>
            {suggestedActions.length > 0 ? (
              <div className="up-next-list">
                {suggestedActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={`up-next-row up-next-${action.kind}`}
                    onClick={() => {
                      playTap();
                      if (action.questId) setSelectedId(action.questId);
                      else navigate(action.to);
                    }}
                  >
                    <Icon name={action.kind === 'quest' ? 'compass' : action.kind === 'notification' ? 'bell' : action.kind === 'streak' ? 'flame' : 'star'} />
                    <div className="up-next-copy">
                      <strong>{action.title}</strong>
                      <small>{action.detail}</small>
                    </div>
                    {action.xp != null && <span className="xp-pill"><Icon name="star" />{action.xp}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mobile-home-empty">You're all caught up. Explore nearby to find your next quest.</p>
            )}
          </motion.section>
        </div>
      </div>

      {/* Footer Bar (desktop only) */}
      <motion.footer className="dashboard-footer dashboard-footer-desktop" variants={staggerItem}>
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
            <div><small>Quests Done</small><strong>{questsCompleted}</strong></div>
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


