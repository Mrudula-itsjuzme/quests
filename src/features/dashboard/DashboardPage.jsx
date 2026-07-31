import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { QuestDetail } from '../quests/QuestDetail';
import { PlayerHeader } from '../quests/QuestsPage';
import { questProgressRatio } from '../quests/QuestCard';
import { useActiveQuests, useMe } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { DashboardSkeleton } from '../../components/motion/SkeletonLoader';
import { IntentionalEmptyState } from '../../components/motion/EmptyState';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';

export function DashboardPage() {
  const { data: me, isLoading: meLoading, isError: meError } = useMe();
  const { data: quests, isLoading: questsLoading, isError: questsError } = useActiveQuests();
  const [selectedId, setSelectedId] = useState(null);

  const activeQuests = useMemo(() => quests || [], [quests]);
  const featured = activeQuests[0] || null;
  const selected = activeQuests.find((quest) => quest.id === selectedId) || null;
  const completedCount = activeQuests.filter((quest) => quest.status === 'completed').length;
  const activeProgress = activeQuests.length
    ? Math.round(activeQuests.reduce((sum, quest) => sum + questProgressRatio(quest), 0) / activeQuests.length * 100)
    : 0;

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
          questsError={questsError}
          featured={featured}
          selected={selected}
          setSelectedId={setSelectedId}
          completedCount={completedCount}
          activeProgress={activeProgress}
        />
      )}
    </AnimatePresence>
  );
}

function DashboardContent({
  me,
  activeQuests,
  questsError,
  featured,
  selected,
  setSelectedId,
  completedCount,
  activeProgress,
}) {
  const featuredRatio = featured ? questProgressRatio(featured) : 0;
  const rankIndex = Math.max(0, Math.floor(((me?.totalXp) || 0) / 500));
  const rankNames = ['Novice I', 'Novice II', 'Novice III', 'Silver I', 'Silver II', 'Gold I'];
  const rank = rankNames[Math.min(rankIndex, rankNames.length - 1)];
  const nextRankXp = (rankIndex + 1) * 500;
  const rankProgress = Math.min(1, ((me?.totalXp) || 0) / nextRankXp);

  return (
    <motion.main
      className="dashboard-reference fantasy-page"
      aria-label="Dashboard"
      variants={staggerContainer(0.06, 0.05)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } }}
    >
      <motion.div variants={staggerItem}>
        <PlayerHeader me={me} page="Dashboard" />
      </motion.div>

      <section className="desktop-command-center" aria-label="Desktop adventure dashboard">
        <div className="desktop-command-main">
          <motion.section className="desktop-progression-hero ornate-panel" variants={staggerItem}>
            <img src="/dashboard-castle-panorama.png" alt="" />
            <div className="desktop-welcome">
              <span>Welcome back,</span>
              <h1>Adventurer!</h1>
              <p>Your journey of growth continues.</p>
              <div>
                <motion.article whileHover={{ scale: 1.04, y: -2 }} onMouseEnter={playHover} transition={springConfig.tactile}>
                  <Icon name="flame" /><span>Streak</span><strong><AnimatedCounter value={me.streakDays || 0} /></strong><small>Days</small>
                </motion.article>
                <motion.article whileHover={{ scale: 1.04, y: -2 }} onMouseEnter={playHover} transition={springConfig.tactile}>
                  <Icon name="shield" /><span>Level</span><strong><AnimatedCounter value={me.level} /></strong><small>{me.tier}</small>
                </motion.article>
              </div>
            </div>
            <div className="desktop-xp-orbit" style={{ '--progress': `${(me.progressToNextLevel || 0) * 360}deg` }}>
              <div>
                <strong><AnimatedCounter value={me.totalXp} /></strong>
                <span>XP</span>
                <small>of {(me.totalXp + (me.xpForCurrentLevel || 500) - (me.xpIntoLevel || 0)).toLocaleString()} XP</small>
              </div>
            </div>
          </motion.section>

          <motion.section className="desktop-today-quests" variants={staggerItem}>
            <div className="desktop-section-heading"><h2>Today’s Quests</h2><span>Reset at midnight</span></div>
            <div>
              {activeQuests.slice(0, 3).map((quest) => (
                <motion.button
                  key={quest.id}
                  type="button"
                  className={`desktop-quest-tile ${quest.category?.toLowerCase() || 'mind'}`}
                  whileHover={{ scale: 1.02, y: -3, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={springConfig.tactile}
                  onClick={() => {
                    playTap();
                    setSelectedId(quest.id);
                  }}
                  onMouseEnter={playHover}
                >
                  <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                  <span className="desktop-quest-tile-copy">
                    <small>{quest.category} quest</small><strong>{quest.title}</strong><span>{quest.description}</span>
                    <i className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${questProgressRatio(quest) * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></i>
                    <b>{quest.progressValue} / {quest.targetValue}</b>
                  </span>
                  <span className="desktop-quest-tile-reward"><small>XP</small><strong>{quest.xpReward}</strong><b>{quest.status}</b></span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="desktop-daily-chest ornate-panel"
            variants={staggerItem}
            whileHover={{ y: -3 }}
            onMouseEnter={playHover}
          >
            <Icon name="chest" /><div><h2>Daily Chest</h2><p>Complete all active quests to unlock today’s reward.</p></div>
            <div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${activeProgress}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div>
            <Link to="/app/rewards" onClick={playTap}>Open rewards <span>›</span></Link>
          </motion.section>
        </div>

        <motion.aside className="desktop-command-rail" variants={staggerItem}>
          <motion.section className="ornate-panel desktop-tier-card" whileHover={{ y: -3 }} onMouseEnter={playHover}>
            <div className="section-title"><h2>Tier Progress</h2></div>
            <Icon name="shield" />
            <div>
              <strong>{rank}</strong>
              <div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${rankProgress * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div>
              <span><AnimatedCounter value={me.totalXp} /> / {nextRankXp.toLocaleString()} XP</span>
              <small>Next: {rankNames[Math.min(rankIndex + 1, rankNames.length - 1)]}</small>
            </div>
          </motion.section>
          <motion.section className="ornate-panel desktop-bonus-card" whileHover={{ y: -3 }} onMouseEnter={playHover}>
            <div><span>Daily Bonus</span><h2>Complete all active quests</h2><p>Finish today’s path before reset.</p><strong>+150 XP</strong></div>
            <Icon name="chest" />
          </motion.section>
          <motion.section className="ornate-panel desktop-encounter-card" whileHover={{ y: -3 }} onMouseEnter={playHover}>
            <span>Rare Encounter</span><h2>{featured?.title || 'Sunset Chaser'}</h2><p>{featured?.description || 'Capture today’s most memorable moment.'}</p><strong>{featured?.xpReward || 250} XP</strong>
          </motion.section>
          <Link className="desktop-all-quests" to="/app/quests" onClick={playTap}>View all quests <span>›</span></Link>
        </motion.aside>
      </section>

      <motion.section className="focus-hero ornate-panel dashboard-focus" variants={staggerItem}>
        <img className="focus-hero-art" src="/quest-scholar-hero.png" alt="" />
        <div className="focus-label"><span>◆</span> Today’s Focus <span>◆</span></div>
        <div className="quest-ring" style={{ '--progress': `${featuredRatio * 360}deg` }}>
          <div><Icon name={featured ? categoryIcon(featured.category) : 'compass'} /><span>{Math.round(featuredRatio * 100)}%</span></div>
        </div>
        <div className="focus-copy">
          <p className="eyebrow">{featured?.category || 'Begin your path'}</p>
          <h2>{featured?.title || 'Your Adventure Awaits'}</h2>
          <span>Objective</span>
          <p>{featured?.description || 'Open the quest board and choose the path you want to follow today.'}</p>
          <strong className="focus-count">{featured ? `${featured.progressValue} / ${featured.targetValue}` : '0 / 1'}</strong>
          <div className="gold-progress" role="progressbar" aria-valuenow={Math.round(featuredRatio * 100)} aria-valuemin="0" aria-valuemax="100"><motion.i initial={{ width: 0 }} animate={{ width: `${featuredRatio * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div>
          <blockquote>Every path begins with one deliberate step.</blockquote>
        </div>
        <div className="character-dialogue"><Icon name="leaf" /><span>Your next chapter is ready. Keep moving forward!</span></div>
      </motion.section>

      <motion.nav className="quest-tabs dashboard-path-tabs" aria-label="Dashboard shortcuts" variants={staggerItem}>
        <Link className="active" to="/app/quests" onClick={playTap} onMouseEnter={playHover}><Icon name="sun" /><span>Quest Board</span></Link>
        <Link to="/app/profile" onClick={playTap} onMouseEnter={playHover}><Icon name="shield" /><span>Level {me.level}</span></Link>
        <Link to="/app/rewards" onClick={playTap} onMouseEnter={playHover}><Icon name="chest" /><span>Rewards</span></Link>
        <Link to="/app/gallery" onClick={playTap} onMouseEnter={playHover}><Icon name="grid" /><span>Gallery</span></Link>
      </motion.nav>

      <div className="quest-content-grid dashboard-content">
        <motion.section className="ornate-panel active-list" variants={staggerItem}>
          <div className="section-title"><h2>Active Quests</h2><span>{activeQuests.filter((quest) => quest.status === 'active').length} active</span></div>
          {questsError && <p role="alert" className="empty-state">Your active quests could not be loaded.</p>}
          {!questsError && activeQuests.length === 0 && (
            <IntentionalEmptyState
              icon="scroll"
              title="No Active Missions"
              description="Your path is clear for today. Visit the quest board to take on new challenges."
              actionLabel="Open Quest Board"
              onAction={() => window.location.assign('/app/quests')}
            />
          )}
          <AnimatePresence mode="popLayout">
            {!questsError && activeQuests.slice(0, 4).map((quest) => (
              <motion.button
                key={quest.id}
                type="button"
                className="reference-quest-row"
                whileHover={{ scale: 1.015, x: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playTap();
                  setSelectedId(quest.id);
                }}
                onMouseEnter={playHover}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springConfig.tactile}
              >
                <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                <span className="quest-copy"><strong>{quest.title}</strong><small>{quest.description}</small><span className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${questProgressRatio(quest) * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></span></span>
                <span className="quest-numbers"><b>{quest.progressValue}/{quest.targetValue}</b><span>XP<br /><strong>{quest.xpReward}</strong></span></span>
              </motion.button>
            ))}
          </AnimatePresence>
          {activeQuests.length > 0 && <Link className="dashboard-view-all" to="/app/quests" onClick={playTap}>View all active quests <span>›</span></Link>}
        </motion.section>

        <motion.aside className="progress-side" variants={staggerItem}>
          <motion.section className="ornate-panel streak-card" whileHover={{ y: -3 }} onMouseEnter={playHover}><h2>Weekly Streak</h2><Icon name="flame" /><strong><AnimatedCounter value={me.streakDays || 0} /></strong><span>days</span><p>Keep the flame alive!</p></motion.section>
          <motion.section className="ornate-panel rank-card" whileHover={{ y: -3 }} onMouseEnter={playHover}><h2>Path Rank</h2><Icon name="compass" /><strong>{rank}</strong><div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${rankProgress * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div><span><AnimatedCounter value={me.totalXp} /> / {nextRankXp.toLocaleString()} XP</span><Link className="gold-button" to="/app/profile" onClick={playTap}>View Progress</Link></motion.section>
        </motion.aside>
      </div>

      <motion.section className="ornate-panel dashboard-overview" variants={staggerItem}>
        <div className="section-title"><h2>Path Overview</h2><span>Your journey at a glance</span></div>
        <div>
          <OverviewStat icon="star" label="Board charge" value={`${activeProgress}%`} />
          <OverviewStat icon="shield" label="Current level" value={me.level} />
          <OverviewStat icon="check" label="Completed" value={completedCount} />
          <OverviewStat icon="bookmark" label="Day streak" value={me.streakDays || 0} />
        </div>
      </motion.section>

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

function OverviewStat({ icon, label, value }) {
  return (
    <motion.article whileHover={{ y: -3, scale: 1.02 }} onMouseEnter={playHover} transition={springConfig.tactile}>
      <span className="round-emblem"><Icon name={icon} /></span>
      <div><small>{label}</small><strong>{typeof value === 'number' ? <AnimatedCounter value={value} /> : value}</strong></div>
    </motion.article>
  );
}
