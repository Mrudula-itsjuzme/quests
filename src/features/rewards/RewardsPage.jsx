import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, categoryIcon } from '../../components/Icon';
import { PlayerHeader } from '../quests/QuestsPage';
import { useCollectibles, useMe } from '../quests/queries';

const badgeDefinitions = [
  { icon: 'sun', label: 'First Light', threshold: 1 },
  { icon: 'shield', label: 'Quest Guard', threshold: 3 },
  { icon: 'compass', label: 'Pathfinder', threshold: 5 },
];

export function RewardsPage() {
  const collectionQuery = useCollectibles();
  const meQuery = useMe();
  const [notice, setNotice] = useState('');

  if (collectionQuery.isLoading || meQuery.isLoading) {
    return <main className="rewards-reference"><div className="skeleton player-skeleton" /><div className="skeleton hero-skeleton" /><div className="skeleton list-skeleton" /><p className="sr-only" role="status">Opening the reward vault…</p></main>;
  }
  if (collectionQuery.isError || meQuery.isError) {
    return <section className="ornate-panel error-state" role="alert"><h2>The reward vault is sealed</h2><p>Please check the quest service and try again.</p></section>;
  }

  const me = meQuery.data;
  const collection = collectionQuery.data || [];
  const seasonTarget = 10000;
  const seasonProgress = Math.min(1, me.totalXp / seasonTarget);
  const rankIndex = Math.max(0, Math.floor(me.totalXp / 500));
  const rankNames = ['Iron I', 'Iron II', 'Iron III', 'Silver I', 'Silver II', 'Gold I'];
  const rank = rankNames[Math.min(rankIndex, rankNames.length - 1)];
  const nextRankXp = (rankIndex + 1) * 500;
  const rankProgress = Math.min(1, me.totalXp / nextRankXp);
  const unlockedBadges = badgeDefinitions.filter((badge) => collection.length >= badge.threshold).length;

  const unavailable = (message) => setNotice(message);

  return (
    <main className="rewards-reference fantasy-page" aria-label="Rewards">
      <PlayerHeader me={me} page="Rewards" />

      <section className="rewards-hero ornate-panel">
        <img src="/rewards-season-chest.png" alt="" />
        <div className="rewards-hero-copy">
          <p className="eyebrow">◆ &nbsp; Season Chest &nbsp; ◆</p>
          <h1>Complete quests to fill the chest.</h1>
        </div>
        <div className="season-progress">
          <strong>{me.totalXp.toLocaleString()} / {seasonTarget.toLocaleString()}</strong>
          <div className="gold-progress"><i style={{ width: `${seasonProgress * 100}%` }} /></div>
          <span>{Math.round(seasonProgress * 100)}% to next reward</span>
        </div>
        <div className="character-dialogue"><Icon name="leaf" /><span>Every quest brings you closer to glory.</span></div>
      </section>

      <div className="rewards-panel-grid">
        <RewardPanel title="Reward Track" className="reward-track-panel">
          <div className="reward-level-shield"><strong>{me.level}</strong><span>Level</span></div>
          <div><h3>{me.tier} Seeker</h3><div className="gold-progress"><i style={{ width: `${me.progressToNextLevel * 100}%` }} /></div><p>{me.xpIntoLevel.toLocaleString()} / {me.xpForCurrentLevel.toLocaleString()} XP</p></div>
          <span className="reward-banner"><Icon name="compass" /></span>
        </RewardPanel>

        <RewardPanel title="Badges" className="badges-panel">
          <div className="badge-row">{badgeDefinitions.map((badge) => <article key={badge.label} className={collection.length >= badge.threshold ? '' : 'locked'}><span className="round-emblem"><Icon name={badge.icon} /></span><strong>{collection.length >= badge.threshold ? badge.threshold : 0}</strong><small>{badge.label}</small></article>)}</div>
          <Link to="/app/gallery">View all badges <span>›</span></Link>
        </RewardPanel>

        <RewardPanel title="Rare Loot" className="loot-panel">
          <div className="loot-row">
            {collection.slice(0, 4).map((item) => <article key={item.assetId}><Icon name={categoryIcon(item.category)} /><strong>{item.title}</strong><span>{item.rarity}</span></article>)}
            {collection.length === 0 && <p className="reward-empty">Complete verified quests to discover rare loot.</p>}
          </div>
          <button type="button" onClick={() => unavailable('Inventory management is not connected yet.')}>View inventory <span>›</span></button>
        </RewardPanel>

        <RewardPanel title="Chest Collection" className="chest-panel">
          <div className="chest-row">
            <article><Icon name="chest" /><strong>{collection.filter((item) => item.rarity === 'Common').length}</strong><span>Bronze</span></article>
            <article><Icon name="chest" /><strong>{collection.filter((item) => item.rarity === 'Rare').length}</strong><span>Silver</span></article>
            <article><Icon name="chest" /><strong>{collection.filter((item) => ['Epic', 'Legendary'].includes(item.rarity)).length}</strong><span>Golden</span></article>
          </div>
          <Link to="/app/gallery">View collection <span>›</span></Link>
        </RewardPanel>

        <RewardPanel title="Claimable Rewards" className="claim-panel">
          <div className="claim-row">
            <article><Icon name="star" /><strong>{me.xpIntoLevel}</strong><span>XP earned</span></article>
            <article><Icon name="scroll" /><strong>{collection.length}</strong><span>Relics</span></article>
            <article><Icon name="chest" /><strong>{unlockedBadges}</strong><span>Badges</span></article>
          </div>
          <button className="claim-all-button" type="button" onClick={() => unavailable('Reward claiming is not connected to the quest service yet.')}>Claim All</button>
        </RewardPanel>

        <RewardPanel title="Current Rank" className="current-rank-panel">
          <span className="rank-crest"><Icon name="shield" /><Icon name="compass" /></span>
          <div><h2>{rank}</h2><span>Honor Score</span><strong>{me.totalXp.toLocaleString()}</strong><div className="gold-progress"><i style={{ width: `${rankProgress * 100}%` }} /></div><p>{me.totalXp.toLocaleString()} / {nextRankXp.toLocaleString()}</p></div>
          <button type="button" onClick={() => unavailable('Leaderboards require the future guild service.')}>View leaderboard <span>›</span></button>
        </RewardPanel>
      </div>

      {notice && <div className="toast-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
    </main>
  );
}

function RewardPanel({ title, className, children }) {
  return <section className={`ornate-panel reward-reference-panel ${className}`}><div className="section-title"><h2>◆ &nbsp; {title} &nbsp; ◆</h2></div>{children}</section>;
}
