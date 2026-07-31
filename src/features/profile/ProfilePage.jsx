import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import {
  cosmeticOptions,
  derivePlayerPresentation,
  loadCosmetics,
  saveCosmetics,
} from '../../lib/playerPresentation';
import { PlayerHeader } from '../quests/QuestsPage';
import { useActiveQuests, useCollectibles, useMe, useQuestHistory } from '../quests/queries';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { DashboardSkeleton, ProfileSkeleton } from '../../components/motion/SkeletonLoader';
import { IntentionalEmptyState } from '../../components/motion/EmptyState';
import { staggerContainer, staggerItem, springConfig } from '../../components/motion/MotionVariants';

export function ProfilePage() {
  const meQuery = useMe();
  const activeQuery = useActiveQuests();
  const historyQuery = useQuestHistory();
  const collectionQuery = useCollectibles();
  const [cosmetics, setCosmetics] = useState(loadCosmetics);
  const [picker, setPicker] = useState(null);
  const [saved, setSaved] = useState('');

  useEffect(() => saveCosmetics(cosmetics), [cosmetics]);

  const isProfileLoading = meQuery.isLoading || activeQuery.isLoading || historyQuery.isLoading || collectionQuery.isLoading;
  const isProfileError = meQuery.isError || activeQuery.isError || historyQuery.isError || collectionQuery.isError;

  return (
    <AnimatePresence mode="wait">
      {isProfileLoading ? (
        <motion.main
          key="profile-skeleton"
          className="profile-reference"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.22 } }}
        >
          <ProfileSkeleton />
          <p className="sr-only" role="status">Loading your profile…</p>
        </motion.main>
      ) : isProfileError ? (
        <motion.section
          key="profile-error"
          className="ornate-panel error-state"
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Your journal could not be opened</h2>
          <p>Please check the quest service and try again.</p>
        </motion.section>
      ) : (
        <ProfileContent
          key="profile-content"
          me={meQuery.data}
          history={historyQuery.data || []}
          collectibles={collectionQuery.data || []}
          activeQuests={activeQuery.data || []}
          cosmetics={cosmetics}
          setCosmetics={setCosmetics}
          picker={picker}
          setPicker={setPicker}
          saved={saved}
          setSaved={setSaved}
        />
      )}
    </AnimatePresence>
  );
}

function ProfileContent({
  me,
  history,
  collectibles,
  activeQuests,
  cosmetics,
  setCosmetics,
  picker,
  setPicker,
  saved,
  setSaved,
}) {
  const presentation = useMemo(
    () => derivePlayerPresentation(me, activeQuests, history, collectibles),
    [me, activeQuests, history, collectibles],
  );
  const xpRatio = me.xpForCurrentLevel ? me.xpIntoLevel / me.xpForCurrentLevel : 0;
  const choose = (key, value) => {
    playTap();
    setCosmetics((current) => ({ ...current, [key]: value }));
    setPicker(null);
    setSaved(`${value} equipped.`);
  };

  return (
    <motion.main
      className="profile-reference fantasy-page"
      variants={staggerContainer(0.05, 0.04)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } }}
    >
      <PlayerHeader me={me} page="Profile" />
      <div className="profile-hero-grid">
        <motion.section className="portrait-panel ornate-panel" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
          <img className="profile-scholar-art" src="/quest-scholar-hero.png" alt="Scholar-adventurer overlooking a distant fantasy city" />
          <div className="portrait-caption"><Icon name="leaf" /><div><h2>{cosmetics.title}</h2><p>Wander. Discover. Become.</p></div></div>
        </motion.section>
        <div className="profile-summary">
          <section className="ornate-panel level-panel">
            <div><span>Level</span><strong>{me.level}</strong></div>
            <div className="xp-ring" style={{ '--progress': `${xpRatio * 360}deg` }}><span><strong>{me.xpIntoLevel.toLocaleString()}</strong><small>/ {me.xpForCurrentLevel.toLocaleString()} XP</small></span></div>
            <div className="summary-stats">
              <ProfileStat icon="scroll" label="Quests completed" value={presentation.completedCount} />
              <ProfileStat icon="flame" label="Current streak" value={`${me.streakDays || 0} days`} />
              <ProfileStat icon="compass" label="Path rank" value={presentation.rank} />
            </div>
          </section>
          <motion.section className="ornate-panel guild-banner" whileHover={{ scale: 1.02 }} onMouseEnter={playHover}>
            <Icon name="shield" /><div><span>Guild</span><h2>Unsworn Wayfarer</h2><p>Guild membership is not connected yet.</p></div>
            <button type="button" onClick={() => { playTap(); setSaved('Guild invitations are not available yet.'); }} aria-label="View guild status">›</button>
          </motion.section>
          <section className="ornate-panel achievements">
            <h2>Achievements</h2>
            <div>
              {presentation.achievements.map((item) => (
                <motion.article key={item.id} className={item.unlocked ? 'unlocked' : 'locked'} whileHover={{ scale: 1.08 }} onMouseEnter={playHover}>
                  <span><Icon name={item.icon} /></span><small>{item.label}</small>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="profile-detail-grid">
        <section className="ornate-panel history-panel">
          <div className="section-title"><h2>Quest History</h2><span>{history.length}</span></div>
          {history.slice(0, 4).map((quest) => (
            <motion.article key={quest.id} whileHover={{ x: 4 }} onMouseEnter={playHover}>
              <div><strong>{quest.title}</strong><span>{quest.status === 'completed' ? 'Completed' : quest.status}</span></div>
              <time>{quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : 'Recently'}</time>
            </motion.article>
          ))}
          {history.length === 0 && <p className="empty-state">Your completed quests will be recorded here.</p>}
        </section>
        <section className="ornate-panel banner-panel">
          <div className="section-title"><h2>Equipped Title & Banner</h2><button type="button" onClick={() => { playTap(); setPicker('banner'); }} aria-label="Change banner"><Icon name="gear" /></button></div>
          <div className="equipped-banner"><Icon name="compass" /></div><h3>{cosmetics.title}</h3><p>{cosmetics.banner} standard</p>
          <motion.button type="button" className="gold-button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { playTap(); setPicker('title'); }}>Change Title</motion.button>
        </section>
        <section className="ornate-panel statistics-panel">
          <div className="section-title"><h2>Statistics</h2><Icon name="grid" /></div>
          <StatRow label="Total quests" value={presentation.totalQuests} />
          <StatRow label="Quests completed" value={presentation.completedCount} />
          <StatRow label="Relics discovered" value={collectibles.length} />
          <StatRow label="Current level" value={me.level} />
          <StatRow label="Total XP" value={me.totalXp.toLocaleString()} />
        </section>
      </div>

      <div className="customisation-grid">
        <section className="ornate-panel gear-preview">
          <h2>Gear Preview</h2>
          <div>
            {cosmeticOptions.gear.map((item, index) => (
              <motion.button
                type="button"
                key={item}
                className={cosmetics.gear === item ? 'selected' : ''}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => choose('gear', item)}
                onMouseEnter={playHover}
                aria-label={`Equip ${item}`}
              >
                <Icon name={['leaf', 'shield', 'star', 'compass', 'gear'][index]} /><span>{item}</span>
              </motion.button>
            ))}
          </div>
        </section>
        <section className="ornate-panel customisation">
          <h2>Customisation</h2>
          <div>
            {['appearance', 'outfit', 'mount', 'companion'].map((key) => (
              <motion.button
                type="button"
                key={key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { playTap(); setPicker(key); }}
                onMouseEnter={playHover}
              >
                <Icon name={key === 'mount' ? 'compass' : key === 'companion' ? 'star' : 'user'} /><span>{key}</span><small>{cosmetics[key]}</small>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {picker && <SelectionSheet title={`Choose ${picker}`} options={cosmeticOptions[picker]} selected={cosmetics[picker]} onChoose={(value) => choose(picker, value)} onClose={() => setPicker(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {saved && (
          <motion.div className="toast-notice" role="status" initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ type: 'spring', stiffness: 450, damping: 25 }}>
            <span>{saved}</span><button type="button" onClick={() => { playTap(); setSaved(''); }} aria-label="Dismiss notification">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function ProfileStat({ icon, label, value }) {
  return (
    <motion.article whileHover={{ scale: 1.04 }} onMouseEnter={playHover}>
      <Icon name={icon} /><span>{label}</span><strong>{value}</strong>
    </motion.article>
  );
}

function StatRow({ label, value }) {
  return <div className="stat-row"><span>{label}</span><strong>{value}</strong></div>;
}

function SelectionSheet({ title, options, selected, onChoose, onClose }) {
  return (
    <motion.div className="selection-overlay" role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="selection-sheet ornate-panel" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 450, damping: 30 }}>
        <div className="section-title"><h2>{title}</h2><button type="button" onClick={() => { playTap(); onClose(); }} aria-label="Close">×</button></div>
        {options.map((item) => (
          <motion.button key={item} type="button" className={selected === item ? 'selected' : ''} whileHover={{ x: 4 }} onMouseEnter={playHover} onClick={() => onChoose(item)}>
            {item}<span>{selected === item ? 'Equipped' : 'Select'}</span>
          </motion.button>
        ))}
      </motion.section>
    </motion.div>
  );
}
