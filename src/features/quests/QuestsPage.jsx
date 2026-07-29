import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { QuestDetail } from './QuestDetail';
import { questProgressRatio } from './QuestCard';
import { playHover, playTap } from '../../lib/useSoundEffects';
import {
  useActiveQuests,
  useCollectibles,
  useGenerateDaily,
  useGenerateMonthly,
  useGenerateWeekly,
  useMe,
  useQuestDefinitions,
  useQuestHistory,
} from './queries';

const tabs = [
  { id: 'daily', label: 'Daily', icon: 'sun' },
  { id: 'weekly', label: 'Weekly', icon: 'grid' },
  { id: 'monthly', label: 'Expedition', icon: 'compass' },
];

function resetLabel() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const minutes = Math.max(0, Math.floor((tomorrow - now) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function QuestsPage() {
  const activeQuery = useActiveQuests();
  const meQuery = useMe();
  const historyQuery = useQuestHistory();
  const collectiblesQuery = useCollectibles();
  const definitionsQuery = useQuestDefinitions();
  const generateDaily = useGenerateDaily();
  const generateWeekly = useGenerateWeekly();
  const generateMonthly = useGenerateMonthly();
  const [tab, setTab] = useState('daily');
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState('');
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckTouchStart, setDeckTouchStart] = useState(null);
  const [deckMotion, setDeckMotion] = useState('settled');

  const quests = useMemo(() => activeQuery.data || [], [activeQuery.data]);
  const history = historyQuery.data || [];
  const collectibles = collectiblesQuery.data || [];
  const visible = quests.filter((quest) => quest.cadence === tab);
  const featured = visible[0] || quests[0] || null;
  const selected = quests.find((quest) => quest.id === selectedId) || null;
  const presentation = derivePlayerPresentation(meQuery.data, quests, history, collectibles);
  const definitions = useMemo(() => {
    const activeDefinitionIds = new Set(quests.map((quest) => quest.definitionId));
    return (definitionsQuery.data || []).filter((item) => !activeDefinitionIds.has(item.id)).slice(0, 3);
  }, [definitionsQuery.data, quests]);

  useEffect(() => setDeckIndex(0), [tab]);

  if (activeQuery.isLoading || meQuery.isLoading) return <QuestSkeleton />;
  if (activeQuery.isError || meQuery.isError) {
    return <section className="ornate-panel error-state" role="alert"><h2>The quest board is veiled</h2><p>We could not reach your quest service. Check your connection and try again.</p></section>;
  }

  const me = meQuery.data;
  const featuredRatio = featured ? questProgressRatio(featured) : 0;
  const hasCadence = (cadence) => quests.some((quest) => quest.cadence === cadence);
  const accept = (cadence) => {
    playTap();
    const mutation = cadence === 'monthly' ? generateMonthly : cadence === 'weekly' ? generateWeekly : generateDaily;
    if (hasCadence(cadence)) {
      setNotice(`Your ${cadence} quests are already active.`);
      return;
    }
    mutation.mutate(undefined, {
      onSuccess: () => setNotice(`${cadence === 'monthly' ? 'Monthly expedition' : cadence === 'weekly' ? 'Weekly quest' : 'Daily quests'} accepted.`),
      onError: () => setNotice('The quest could not be accepted. Please try again.'),
    });
  };
  const moveDeck = (direction) => {
    playTap();
    setDeckMotion(direction > 0 ? 'next' : 'previous');
    setDeckIndex((index) => Math.max(0, Math.min(visible.length - 1, index + direction)));
  };
  const finishDeckSwipe = (clientX) => {
    if (deckTouchStart === null) return;
    const distance = clientX - deckTouchStart;
    if (Math.abs(distance) > 42) moveDeck(distance < 0 ? 1 : -1);
    setDeckTouchStart(null);
  };

  return (
    <main className="quest-reference fantasy-page" aria-label="Quests">
      <PlayerHeader me={me} page="Quests" />

      <section className="mobile-quest-board" aria-label="Mobile quest deck">
        <nav className="mobile-cadence-tabs" aria-label="Mobile quest cadence">
          {tabs.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              className={tab === item.id ? 'active' : ''}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playTap();
                setTab(item.id);
              }}
              onMouseEnter={playHover}
            >
              <Icon name={item.icon} /><span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {visible.length ? (
          <>
            <div
              className="mobile-deck-window"
              data-motion={deckMotion}
              onTouchStart={(event) => setDeckTouchStart(event.touches[0].clientX)}
              onTouchEnd={(event) => finishDeckSwipe(event.changedTouches[0].clientX)}
              onTransitionEnd={() => setDeckMotion('settled')}
            >
              {visible.map((quest, index) => {
                const offset = index - deckIndex;
                if (offset < -1 || offset > 1) return null;
                const ratio = questProgressRatio(quest);
                const position = offset === 0 ? 'current' : offset < 0 ? 'previous' : 'next';
                return (
                  <motion.article
                    key={quest.id}
                    className={`mobile-deck-card ${position}`}
                    aria-hidden={offset !== 0}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <div className="mobile-deck-category"><span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span><strong>{quest.category}</strong></div>
                    <h2>{quest.title}</h2>
                    <p>{quest.description}</p>
                    <div className="mobile-deck-divider" />
                    <strong className="mobile-deck-progress">{quest.progressValue} / {quest.targetValue}<small>{quest.unit || 'progress'}</small></strong>
                    <div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${ratio * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div>
                    <div className="mobile-deck-reward"><span>XP</span><strong>{quest.xpReward}</strong></div>
                    <div className="mobile-deck-actions">
                      <motion.button className="gold-button" type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { playTap(); setSelectedId(quest.id); }}>Resume <span>›</span></motion.button>
                      <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => { playTap(); setSelectedId(quest.id); }}>Details</motion.button>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            <div className="mobile-deck-controls" aria-label="Quest deck controls">
              <button type="button" onClick={() => moveDeck(-1)} disabled={deckIndex === 0} aria-label="Previous quest">‹</button>
              <div>{visible.map((quest, index) => <button key={quest.id} type="button" className={index === deckIndex ? 'active' : ''} onClick={() => { playTap(); setDeckMotion(index > deckIndex ? 'next' : 'previous'); setDeckIndex(index); }} aria-label={`Show ${quest.title}`} />)}</div>
              <button type="button" onClick={() => moveDeck(1)} disabled={deckIndex === visible.length - 1} aria-label="Next quest">›</button>
            </div>

            <section className="mobile-today-summary ornate-panel">
              <div className="section-title"><h2>Today’s Summary</h2><span>Daily path</span></div>
              <div>
                <article><Icon name="check" /><strong>{visible.filter((quest) => quest.status === 'completed').length}</strong><span>Completed</span></article>
                <article><Icon name="compass" /><strong>{visible.filter((quest) => quest.status !== 'completed').length}</strong><span>Remaining</span></article>
              </div>
            </section>
          </>
        ) : (
          <section className="mobile-deck-empty ornate-panel">
            <Icon name="scroll" /><h2>No {tab} quests yet</h2>
            <p>Generate a new set to begin this path.</p>
            <motion.button className="gold-button" type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => accept(tab)}>Generate {tab} quests</motion.button>
          </section>
        )}

        <section className="mobile-available-rail">
          <div className="section-title"><h2>Available Quests</h2><span>Swipe to explore</span></div>
          <div>
            {definitions.map((quest) => (
              <motion.article key={quest.id} whileHover={{ y: -3 }} onMouseEnter={playHover}>
                <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                <strong>{quest.title}</strong>
                <small>{quest.description}</small>
                <span>{quest.xpReward} XP</span>
                <motion.button type="button" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => accept(quest.cadence)} disabled={generateDaily.isPending || generateWeekly.isPending || generateMonthly.isPending}>Accept</motion.button>
              </motion.article>
            ))}
            {!definitionsQuery.isLoading && definitions.length === 0 && <p className="empty-state">Every available quest is already active.</p>}
          </div>
        </section>
      </section>

      <motion.section className="focus-hero ornate-panel" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
        <img className="focus-hero-art" src="/quest-scholar-hero.png" alt="" />
        <div className="focus-label"><span>◆</span> Today’s Focus <span>◆</span></div>
        <div className="quest-ring" style={{ '--progress': `${featuredRatio * 360}deg` }}>
          <div><Icon name={featured ? categoryIcon(featured.category) : 'book'} /><span>{Math.round(featuredRatio * 100)}%</span></div>
        </div>
        <div className="focus-copy">
          <p className="eyebrow">{featured?.category || 'Begin your path'}</p>
          <h2>{featured?.title || 'The Scholar’s Path'}</h2>
          <span>Objective</span>
          <p>{featured?.description || 'Generate today’s quests to begin your adventure.'}</p>
          <strong className="focus-count">{featured ? `${featured.progressValue} / ${featured.targetValue}` : '0 / 3'}</strong>
          <div className="gold-progress" role="progressbar" aria-valuenow={Math.round(featuredRatio * 100)} aria-valuemin="0" aria-valuemax="100"><motion.i initial={{ width: 0 }} animate={{ width: `${featuredRatio * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div>
          <blockquote>Knowledge is a blade. Sharpen it.</blockquote>
        </div>
        <div className="character-dialogue"><Icon name="leaf" /><span>Every step forward brings you closer to legend. Keep going!</span></div>
      </motion.section>

      <div className="quest-tabs" role="tablist" aria-label="Quest cadence">
        {tabs.map((item) => (
          <motion.button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              playTap();
              setTab(item.id);
            }}
            onMouseEnter={playHover}
          >
            {tab === item.id && (
              <motion.div className="active-tab-bg" layoutId="questTabBg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
            )}
            <Icon name={item.icon} /><span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="quest-content-grid">
        <section className="ornate-panel active-list">
          <div className="section-title"><h2>Active Quests</h2><span>{visible.length} active</span></div>
          {visible.length === 0 && (
            <div className="empty-state"><Icon name="scroll" /><p>No {tab} quests yet.</p><motion.button className="gold-button" type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => accept(tab)}>Generate {tab} quests</motion.button></div>
          )}
          <AnimatePresence mode="popLayout">
            {visible.map((quest) => (
              <motion.button
                key={quest.id}
                type="button"
                className="reference-quest-row"
                whileHover={{ scale: 1.015, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playTap();
                  setSelectedId(quest.id);
                }}
                onMouseEnter={playHover}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                <span className="quest-copy"><strong>{quest.title}</strong><small>{quest.description}</small><span className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${questProgressRatio(quest) * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></span></span>
                <span className="quest-numbers"><b>{quest.progressValue}/{quest.targetValue}</b><span>XP<br /><strong>{quest.xpReward}</strong></span></span>
              </motion.button>
            ))}
          </AnimatePresence>
        </section>
        <aside className="progress-side">
          <motion.section className="ornate-panel streak-card" whileHover={{ y: -3 }} onMouseEnter={playHover}><h2>Weekly Streak</h2><Icon name="flame" /><strong>{me.streakDays || 0}</strong><span>days</span><p>Keep the flame alive!</p></motion.section>
          <motion.section className="ornate-panel rank-card" whileHover={{ y: -3 }} onMouseEnter={playHover}><h2>Path Rank</h2><Icon name="compass" /><strong>{presentation.rank}</strong><div className="gold-progress"><motion.i initial={{ width: 0 }} animate={{ width: `${presentation.rankProgress * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} /></div><span>{me.totalXp.toLocaleString()} / {presentation.nextRankXp.toLocaleString()} XP</span></motion.section>
        </aside>
      </div>

      <section className="ornate-panel available-quests">
        <div className="section-title"><h2>Available Quests</h2><span>⌛ New quests in {resetLabel()}</span></div>
        {definitionsQuery.isLoading && <p role="status">Consulting the quest archive…</p>}
        <div className="available-grid">
          {definitions.map((quest) => (
            <motion.article key={quest.id} className="available-card" whileHover={{ y: -4, scale: 1.02 }} onMouseEnter={playHover}>
              <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
              <h3>{quest.title}</h3><p>{quest.description}</p>
              <div><span>◈ {quest.xpReward} XP</span><span>{quest.cadence}</span></div>
              <motion.button className="gold-button" type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => accept(quest.cadence)} disabled={generateDaily.isPending || generateWeekly.isPending || generateMonthly.isPending}>Accept Quest</motion.button>
            </motion.article>
          ))}
          {!definitionsQuery.isLoading && definitions.length === 0 && <p className="empty-state">All currently available quests are already on your board.</p>}
        </div>
      </section>

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
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            >
              <button className="detail-close" type="button" onClick={() => { playTap(); setSelectedId(null); }} aria-label="Close quest details">×</button>
              <QuestDetail quest={selected} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast-notice"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          >
            <span>{notice}</span>
            <button type="button" onClick={() => { playTap(); setNotice(''); }} aria-label="Dismiss notification">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export function PlayerHeader({ me, page }) {
  return (
    <header className="reference-header">
      <motion.div className="avatar-medallion" whileHover={{ scale: 1.08, rotate: 3 }} onMouseEnter={playHover}>
        <span>{(me.displayName || 'S')[0].toUpperCase()}</span><b>{me.level}</b>
      </motion.div>
      <div className="player-heading">
        <h1>{page}</h1>
        <p>{me.displayName || 'Mind in progress'} <i /></p>
        <span><Icon name="shield" /> {me.totalXp.toLocaleString()} XP</span>
      </div>
      <div className="header-orbit">
        <motion.button type="button" aria-label="Notifications" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => { playTap(); window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'No new notices. Your path is clear.' })); }}>
          <Icon name="bell" />
        </motion.button>
        <motion.button type="button" aria-label="Open path compass" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => { playTap(); window.dispatchEvent(new CustomEvent('habbit-notice', { detail: `Your current path rank is ${me.tier || 'Novice'}.` })); }}>
          <Icon name="compass" />
        </motion.button>
      </div>
    </header>
  );
}

function QuestSkeleton() {
  return <main className="quest-reference" aria-busy="true"><div className="skeleton player-skeleton" /><div className="skeleton hero-skeleton" /><div className="skeleton list-skeleton" /><p className="sr-only" role="status">Loading your quest journal…</p></main>;
}
