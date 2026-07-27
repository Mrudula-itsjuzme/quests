import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useFeed, useLeaderboard } from '../quests/queries';

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
        <div className="avatar-medallion"><span>C</span></div>
        <div><p className="eyebrow">THE WAYFARER NETWORK</p><h1>Community</h1><p>Verified accomplishments from fellow adventurers.</p></div>
      </header>

      <nav className="community-tabs" aria-label="Community views">
        <button type="button" className={tab === 'feed' ? 'active' : ''} onClick={() => setTab('feed')}><Icon name="scroll" /> Quest Feed</button>
        <button type="button" className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}><Icon name="star" /> Global Rank</button>
        <button type="button" className={tab === 'guild' ? 'active' : ''} onClick={() => setTab('guild')}><Icon name="shield" /> Guild</button>
      </nav>

      {tab === 'feed' && <section className="community-feed" aria-label="Quest completion feed">
        {feed.map((entry) => <article key={entry.id} className="ornate-panel feed-card">
          <div className="round-emblem"><Icon name="compass" /></div>
          <div><span>{entry.rankTitle}</span><h2>{entry.displayName}</h2><p>Completed <strong>{entry.questName}</strong></p><small>{new Date(entry.createdAt).toLocaleString()}</small></div>
          <strong className="feed-xp">+{entry.xpEarned} XP</strong>
        </article>)}
        {feed.length === 0 && <section className="ornate-panel unavailable-panel"><Icon name="scroll" /><h2>No shared victories yet</h2><p>Approved Discovery, Weekly, and Monthly quests appear here when the adventurer keeps sharing enabled.</p></section>}
      </section>}

      {tab === 'leaderboard' && <section className="ornate-panel leaderboard-page-panel">
        <div className="section-title"><h2>Global Leaderboard</h2><span>Ranked by cumulative XP</span></div>
        <div className="leaderboard-list">{leaderboard.map((entry) => <article key={entry.userId} className={entry.isCurrentUser ? 'current' : ''}><strong>#{entry.position}</strong><span>{entry.displayName}<small>{entry.rankTitle}</small></span><b>{entry.totalXp.toLocaleString()} XP</b></article>)}</div>
      </section>}

      {tab === 'guild' && <section className="ornate-panel unavailable-panel">
        <span className="large-emblem"><Icon name="shield" /></span>
        <h2>Your guild hall is quiet</h2>
        <p>Guild membership and collaborative challenges remain a roadmap feature in the specification. No membership or activity is fabricated.</p>
      </section>}
    </main>
  );
}
