import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { useClaimRewards, useCollectibles, useLeaderboard, useMe, useRewards } from '../quests/queries';
import { playHover, playSuccess, playTap } from '../../lib/useSoundEffects';
import { coinBalance } from '../../lib/playerEconomy';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { RewardsSkeleton } from '../../components/motion/SkeletonLoader';
import { HoldButton } from '../../components/motion/HoldButton';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';

const badgeDefinitions = [
  { icon: 'sun', label: 'First Light', threshold: 1 },
  { icon: 'shield', label: 'Quest Guard', threshold: 3 },
  { icon: 'compass', label: 'Pathfinder', threshold: 5 },
];

// Store catalogue is presentational only until a redemption endpoint exists —
// see the disabled state and note in the Store panel.
const STORE_ITEMS = [
  { key: 'explorer-chest', label: 'Explorer Chest', cost: 500 },
  { key: 'elite-chest', label: 'Elite Chest', cost: 2000 },
];

export function RewardsPage() {
  const collectionQuery = useCollectibles();
  const meQuery = useMe();
  const rewardsQuery = useRewards();
  const leaderboardQuery = useLeaderboard();
  const claimRewards = useClaimRewards();
  const [notice, setNotice] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isRewardsLoading = collectionQuery.isLoading || meQuery.isLoading || rewardsQuery.isLoading || leaderboardQuery.isLoading;
  const isRewardsError = collectionQuery.isError || meQuery.isError || rewardsQuery.isError || leaderboardQuery.isError;

  return (
    <AnimatePresence mode="wait">
      {isRewardsLoading ? (
        <motion.main
          key="rewards-skeleton"
          className="rewards-reference"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.22 } }}
        >
          <RewardsSkeleton />
          <p className="sr-only" role="status">Opening the reward vault…</p>
        </motion.main>
      ) : isRewardsError ? (
        <motion.section
          key="rewards-error"
          className="ornate-panel error-state"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>The reward vault is sealed</h2>
          <p>Please check the quest service and try again.</p>
        </motion.section>
      ) : (
        <RewardsContent
          key="rewards-content"
          me={meQuery.data}
          collection={collectionQuery.data || []}
          rewards={rewardsQuery.data || []}
          leaderboard={leaderboardQuery.data || []}
          claimRewards={claimRewards}
          notice={notice}
          setNotice={setNotice}
          showLeaderboard={showLeaderboard}
          setShowLeaderboard={setShowLeaderboard}
        />
      )}
    </AnimatePresence>
  );
}

function RewardsContent({
  me,
  collection,
  rewards,
  leaderboard,
  claimRewards,
  notice,
  setNotice,
  showLeaderboard,
  setShowLeaderboard,
}) {
  // The reward track is level-gated by quest_level_rewards, so "progress to the
  // next reward" is progress through the current level — not a hardcoded XP goal.
  const coins = coinBalance(me);
  const claimable = rewards.filter((reward) => reward.status === 'claimable');
  const nextRewardLevel = rewards.find((reward) => reward.level > me.level)?.level ?? null;
  const seasonProgress = Math.min(1, Math.max(0, me.progressToNextLevel || 0));
  const currentRank = leaderboard.find((entry) => entry.isCurrentUser) || { position: '—', rankTitle: 'Adventurer', totalXp: me.totalXp };
  const unavailable = (message) => { playTap(); setNotice(message); };

  return (
    <motion.main
      className="rewards-reference fantasy-page"
      aria-label="Rewards"
      variants={staggerContainer(0.05, 0.04)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } }}
    >
      <motion.div variants={staggerItem} className="quests-header">
        <h1>REWARDS & STORE</h1>
      </motion.div>

      <motion.section className="rewards-hero ornate-panel" variants={staggerItem}>
        <img src="/rewards-season-chest.png" alt="" />
        <div className="rewards-hero-copy">
          <p className="eyebrow">◆ &nbsp; Season Chest &nbsp; ◆</p>
          <h1>
            {claimable.length
              ? `${claimable.length} reward${claimable.length === 1 ? '' : 's'} ready to claim.`
              : 'Complete quests to fill the chest.'}
          </h1>
        </div>
        <div className="season-progress">
          <strong><AnimatedCounter value={me.xpIntoLevel} /> / {me.xpForCurrentLevel.toLocaleString()} XP</strong>
          <div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${seasonProgress * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div>
          <span>
            {nextRewardLevel
              ? `${Math.round(seasonProgress * 100)}% toward level ${me.level + 1} · next reward at level ${nextRewardLevel}`
              : `${Math.round(seasonProgress * 100)}% toward level ${me.level + 1}`}
          </span>
        </div>
        <div className="character-dialogue"><Icon name="leaf" /><span>Every quest brings you closer to glory.</span></div>
      </motion.section>

      <motion.div className="rewards-panel-grid" variants={staggerItem}>
        <RewardPanel title="Reward Track" className="reward-track-panel">
          <div className="reward-level-shield"><strong><AnimatedCounter value={me.level} /></strong><span>Level</span></div>
          <div><h3>{me.tier} Seeker</h3><div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${me.progressToNextLevel * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div><p><AnimatedCounter value={me.xpIntoLevel} /> / {me.xpForCurrentLevel.toLocaleString()} XP</p></div>
          <span className="reward-banner"><Icon name="compass" /></span>
        </RewardPanel>

        <RewardPanel title="Badges" className="badges-panel">
          <div className="badge-row">{badgeDefinitions.map((badge) => <motion.article key={badge.label} className={collection.length >= badge.threshold ? '' : 'locked'} whileHover={{ scale: 1.05 }} onMouseEnter={playHover} transition={springConfig.tactile}><span className="round-emblem"><Icon name={badge.icon} /></span><strong>{collection.length >= badge.threshold ? badge.threshold : 0}</strong><small>{badge.label}</small></motion.article>)}</div>
          <Link to="/app/collection" onClick={playTap}>View all badges <span>›</span></Link>
        </RewardPanel>

        <RewardPanel title="Rare Loot" className="loot-panel">
          <div className="loot-row">
            {collection.slice(0, 4).map((item) => <motion.article key={item.assetId} whileHover={{ y: -3 }} onMouseEnter={playHover} transition={springConfig.tactile}><Icon name={categoryIcon(item.category)} /><strong>{item.title}</strong><span>{item.rarity}</span></motion.article>)}
            {collection.length === 0 && <p className="reward-empty">Complete verified quests to discover rare loot.</p>}
          </div>
          <button type="button" onClick={() => unavailable('Inventory management is not connected yet.')}>View inventory <span>›</span></button>
        </RewardPanel>

        <RewardPanel title="Store" className="store-panel">
          <div className="store-balance">
            <Icon name="coin" />
            <strong><AnimatedCounter value={coins} /></strong>
            <span>coins earned from captures</span>
          </div>
          <div className="store-item-row">
            {STORE_ITEMS.map((item) => (
              <article key={item.key} className="store-item">
                <Icon name="chest" />
                <strong>{item.label}</strong>
                <span>{item.cost.toLocaleString()} coins</span>
                {/* Redemption has no server endpoint yet, so the control is
                    genuinely disabled rather than faking a transaction. */}
                <button type="button" disabled aria-describedby="store-availability">
                  Coming soon
                </button>
              </article>
            ))}
          </div>
          <p id="store-availability" className="reward-empty">
            Chest redemption is not available yet. Coins keep accruing from verified captures.
          </p>
        </RewardPanel>

        <RewardPanel title="Chest Collection" className="chest-panel">
          <div className="chest-row">
            <motion.article whileHover={{ y: -3 }} onMouseEnter={playHover} transition={springConfig.tactile}><Icon name="chest" /><strong>{collection.filter((item) => item.rarity === 'Common').length}</strong><span>Bronze</span></motion.article>
            <motion.article whileHover={{ y: -3 }} onMouseEnter={playHover} transition={springConfig.tactile}><Icon name="chest" /><strong>{collection.filter((item) => item.rarity === 'Rare').length}</strong><span>Silver</span></motion.article>
            <motion.article whileHover={{ y: -3 }} onMouseEnter={playHover} transition={springConfig.tactile}><Icon name="chest" /><strong>{collection.filter((item) => ['Epic', 'Legendary'].includes(item.rarity)).length}</strong><span>Golden</span></motion.article>
          </div>
          <Link to="/app/collection" onClick={playTap}>View collection <span>›</span></Link>
        </RewardPanel>

        <RewardPanel title="Claimable Rewards" className="claim-panel">
          <div className="claim-row">
            {rewards.filter((reward) => reward.status === 'claimable').slice(0, 3).map((reward) => <motion.article key={reward.level} whileHover={{ scale: 1.04 }} onMouseEnter={playHover} transition={springConfig.tactile}><Icon name={reward.rewardType === 'badge' ? 'star' : reward.rewardType === 'title' ? 'scroll' : 'chest'} /><strong>{reward.amount}</strong><span>{reward.label}</span></motion.article>)}
            {!rewards.some((reward) => reward.status === 'claimable') && <p className="reward-empty">Your next milestone reward is still ahead.</p>}
          </div>
          <HoldButton 
            className="claim-all-button"
            disabled={claimRewards.isPending || !rewards.some((reward) => reward.status === 'claimable')}
            onComplete={async () => { 
              playSuccess(); 
              const claimed = await claimRewards.mutateAsync(); 
              setTimeout(() => setNotice(claimed.length ? `${claimed.length} milestone reward${claimed.length === 1 ? '' : 's'} claimed.` : 'No rewards are ready yet.'), 600); 
            }}
          >
            Hold to Claim
          </HoldButton>
        </RewardPanel>

        <RewardPanel title="Current Rank" className="current-rank-panel">
          <span className="rank-crest"><Icon name="shield" /><Icon name="compass" /></span>
          <div><h2>{currentRank.rankTitle}</h2><span>Global position</span><strong>#{currentRank.position}</strong><div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${me.progressToNextLevel * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div><p><AnimatedCounter value={me.totalXp} /> cumulative XP</p></div>
          <button type="button" onClick={() => { playTap(); setShowLeaderboard(true); }}>View leaderboard <span>›</span></button>
        </RewardPanel>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setShowLeaderboard(false)}>
              <motion.section className="quest-modal leaderboard-modal" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={springConfig.snappy} onMouseDown={(event) => event.stopPropagation()}>
                <div className="section-title"><h2 id="leaderboard-title">Global Leaderboard</h2><button type="button" onClick={() => { playTap(); setShowLeaderboard(false); }} aria-label="Close leaderboard">×</button></div>
                <div className="leaderboard-list">
                  {leaderboard.map((entry) => (
                    <motion.article key={entry.userId} className={entry.isCurrentUser ? 'current' : ''} whileHover={{ x: 4 }} onMouseEnter={playHover} transition={springConfig.tactile}>
                      <strong>#{entry.position}</strong><span>{entry.displayName}<small>{entry.rankTitle}</small></span><b><AnimatedCounter value={entry.totalXp} /> XP</b>
                    </motion.article>
                  ))}
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {createPortal(
        <AnimatePresence>
          {notice && (
            <motion.div className="toast-notice" role="status" initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={springConfig.snappy}>
              <span>{notice}</span><button type="button" onClick={() => { playTap(); setNotice(''); }} aria-label="Dismiss notification">×</button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.main>
  );
}

function RewardPanel({ title, className, children }) {
  return (
    <motion.section className={`ornate-panel reward-reference-panel ${className}`} whileHover={{ y: -2 }} onMouseEnter={playHover} transition={springConfig.tactile}>
      <div className="section-title"><h2>◆ &nbsp; {title} &nbsp; ◆</h2></div>
      {children}
    </motion.section>
  );
}
