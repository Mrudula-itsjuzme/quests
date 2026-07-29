import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useFeed, useLeaderboard } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';

export function GuildPage() {
  const feedQuery = useFeed();
  const leaderboardQuery = useLeaderboard();
  const [tab, setTab] = useState('feed');

  if (feedQuery.isLoading || leaderboardQuery.isLoading) {
    return <main className="guild-page page-stack fantasy-page" aria-busy="true"><div className="skeleton player-skeleton" /><div className="skeleton list-skeleton" /></main>;
  }
  if (feedQuery.isError || leaderboardQuery.isError) {
    return <section className="ornate-panel error-state" role="alert"><h2>The community path is unavailable</h2><p>Please check the quest service and try again.</p></section>;
  }

  const feed = feedQuery.data || [];
  const leaderboard = leaderboardQuery.data || [];

  return (
    <main className="guild-page page-stack fantasy-page">
      <header className="reference-header compact-header">
        <motion.div className="avatar-medallion" whileHover={{ scale: 1.08 }} onMouseEnter={playHover}>
          <span>C</span>
        </motion.div>
        <div>
          <p className="eyebrow">THE WAYFARER NETWORK</p>
          <h1>Community</h1>
          <p>Verified accomplishments from fellow adventurers.</p>
        </div>
      </header>

      <nav className="community-tabs" aria-label="Community views">
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
      </nav>

      <AnimatePresence mode="wait">
        {tab === 'feed' && (
          <motion.section key="feed" className="community-feed" aria-label="Quest completion feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {feed.map((entry) => (
              <motion.article key={entry.id} className="ornate-panel feed-card" whileHover={{ scale: 1.015, x: 4 }} onMouseEnter={playHover}>
                <div className="round-emblem"><Icon name="compass" /></div>
                <div><span>{entry.rankTitle}</span><h2>{entry.displayName}</h2><p>Completed <strong>{entry.questName}</strong></p><small>{new Date(entry.createdAt).toLocaleString()}</small></div>
                <strong className="feed-xp">+{entry.xpEarned} XP</strong>
              </motion.article>
            ))}
            {feed.length === 0 && <section className="ornate-panel unavailable-panel"><Icon name="scroll" /><h2>No shared victories yet</h2><p>Approved Discovery, Weekly, and Monthly quests appear here when the adventurer keeps sharing enabled.</p></section>}
          </motion.section>
        )}

        {tab === 'leaderboard' && (
          <motion.section key="leaderboard" className="ornate-panel leaderboard-page-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="section-title"><h2>Global Leaderboard</h2><span>Ranked by cumulative XP</span></div>
            <div className="leaderboard-list">
              {leaderboard.map((entry) => (
                <motion.article key={entry.userId} className={entry.isCurrentUser ? 'current' : ''} whileHover={{ x: 4 }} onMouseEnter={playHover}>
                  <strong>#{entry.position}</strong><span>{entry.displayName}<small>{entry.rankTitle}</small></span><b>{entry.totalXp.toLocaleString()} XP</b>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {tab === 'guild' && (
          <motion.section key="guild" className="ornate-panel unavailable-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <span className="large-emblem"><Icon name="shield" /></span>
            <h2>Your guild hall is quiet</h2>
            <p>Guild membership and collaborative challenges remain a roadmap feature in the specification. No membership or activity is fabricated.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
