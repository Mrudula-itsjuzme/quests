import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useFeed, useLeaderboard } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { DashboardSkeleton } from '../../components/motion/SkeletonLoader';
import { IntentionalEmptyState } from '../../components/motion/EmptyState';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';

export function GuildPage() {
  const feedQuery = useFeed();
  const leaderboardQuery = useLeaderboard();
  const [tab, setTab] = useState('feed');

  if (feedQuery.isLoading || leaderboardQuery.isLoading) {
    return (
      <main className="guild-page page-stack fantasy-page" aria-busy="true">
        <DashboardSkeleton />
      </main>
    );
  }
  if (feedQuery.isError || leaderboardQuery.isError) {
    return <section className="ornate-panel error-state" role="alert"><h2>The community path is unavailable</h2><p>Please check the quest service and try again.</p></section>;
  }

  const feed = feedQuery.data || [];
  const leaderboard = leaderboardQuery.data || [];

  return (
    <motion.main
      className="guild-page page-stack fantasy-page"
      variants={staggerContainer(0.05, 0.04)}
      initial="hidden"
      animate="show"
    >
      <motion.header className="reference-header compact-header" variants={staggerItem}>
        <motion.div className="avatar-medallion" whileHover={{ scale: 1.08 }} onMouseEnter={playHover} transition={springConfig.tactile}>
          <span>C</span>
        </motion.div>
        <div>
          <p className="eyebrow">THE WAYFARER NETWORK</p>
          <h1>Community</h1>
          <p>Verified accomplishments from fellow adventurers.</p>
        </div>
      </motion.header>

      <motion.nav className="community-tabs" aria-label="Community views" variants={staggerItem}>
        <button
          type="button"
          className={tab === 'feed' ? 'active' : ''}
          onClick={() => { playTap(); setTab('feed'); }}
          onMouseEnter={playHover}
        >
          {tab === 'feed' && <motion.div className="active-tab-bg" layoutId="guildTabBg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          <Icon name="scroll" /> Quest Feed
        </button>
        <button
          type="button"
          className={tab === 'leaderboard' ? 'active' : ''}
          onClick={() => { playTap(); setTab('leaderboard'); }}
          onMouseEnter={playHover}
        >
          {tab === 'leaderboard' && <motion.div className="active-tab-bg" layoutId="guildTabBg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          <Icon name="star" /> Global Rank
        </button>
        <button
          type="button"
          className={tab === 'guild' ? 'active' : ''}
          onClick={() => { playTap(); setTab('guild'); }}
          onMouseEnter={playHover}
        >
          {tab === 'guild' && <motion.div className="active-tab-bg" layoutId="guildTabBg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          <Icon name="shield" /> Guild
        </button>
      </motion.nav>

      <AnimatePresence mode="wait">
        {tab === 'feed' && (
          <motion.section key="feed" className="community-feed" aria-label="Quest completion feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
            {feed.map((entry) => (
              <motion.article key={entry.id} className="ornate-panel feed-card" whileHover={{ scale: 1.015, x: 4, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }} onMouseEnter={playHover} transition={springConfig.tactile}>
                <div className="round-emblem"><Icon name="compass" /></div>
                <div><span>{entry.rankTitle}</span><h2>{entry.displayName}</h2><p>Completed <strong>{entry.questName}</strong></p><small>{new Date(entry.createdAt).toLocaleString()}</small></div>
                <strong className="feed-xp">+<AnimatedCounter value={entry.xpEarned} /> XP</strong>
              </motion.article>
            ))}
            {feed.length === 0 && (
              <section className="ornate-panel unavailable-panel">
                <IntentionalEmptyState
                  icon="scroll"
                  title="No Shared Victories Yet"
                  description="Approved Discovery, Weekly, and Monthly quests appear here when adventurers share their completions."
                />
              </section>
            )}
          </motion.section>
        )}

        {tab === 'leaderboard' && (
          <motion.section key="leaderboard" className="ornate-panel leaderboard-page-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
            <div className="section-title"><h2>Global Leaderboard</h2><span>Ranked by cumulative XP</span></div>
            <div className="leaderboard-list">
              {leaderboard.map((entry) => (
                <motion.article key={entry.userId} className={entry.isCurrentUser ? 'current' : ''} whileHover={{ x: 4 }} onMouseEnter={playHover} transition={springConfig.tactile}>
                  <strong>#{entry.position}</strong><span>{entry.displayName}<small>{entry.rankTitle}</small></span><b><AnimatedCounter value={entry.totalXp} /> XP</b>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {tab === 'guild' && (
          <motion.section key="guild" className="ornate-panel unavailable-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
            <IntentionalEmptyState
              icon="shield"
              title="Your Guild Hall is Quiet"
              description="Guild membership and collaborative team challenges are ready on the live-service platform roadmap."
            />
          </motion.section>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
