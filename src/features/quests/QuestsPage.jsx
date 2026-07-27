import { useEffect, useMemo, useState } from 'react';
import { Icon, categoryIcon } from '../../components/Icon';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { QuestDetail } from './QuestDetail';
import { questProgressRatio } from './QuestCard';
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
            <button key={item.id} type="button" aria-pressed={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>

        {visible.length ? (
          <>
            <div
              className="mobile-deck-window"
              onTouchStart={(event) => setDeckTouchStart(event.touches[0].clientX)}
              onTouchEnd={(event) => finishDeckSwipe(event.changedTouches[0].clientX)}
            >
              {visible.map((quest, index) => {
                const offset = index - deckIndex;
                if (offset < -1 || offset > 1) return null;
                const ratio = questProgressRatio(quest);
                const position = offset === 0 ? 'current' : offset < 0 ? 'previous' : 'next';
                return (
                  <article key={quest.id} className={`mobile-deck-card ${position}`} aria-hidden={offset !== 0}>
                    <div className="mobile-deck-category"><span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span><strong>{quest.category}</strong></div>
                    <h2>{quest.title}</h2>
                    <p>{quest.description}</p>
                    <div className="mobile-deck-divider" />
                    <strong className="mobile-deck-progress">{quest.progressValue} / {quest.targetValue}<small>{quest.unit || 'progress'}</small></strong>
                    <div className="gold-progress"><i style={{ width: `${ratio * 100}%` }} /></div>
                    <div className="mobile-deck-reward"><span>XP</span><strong>{quest.xpReward}</strong></div>
                    <div className="mobile-deck-actions">
                      <button className="gold-button" type="button" onClick={() => setSelectedId(quest.id)}>Resume <span>›</span></button>
                      <button type="button" onClick={() => setSelectedId(quest.id)}>Details</button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mobile-deck-controls" aria-label="Quest deck controls">
              <button type="button" onClick={() => moveDeck(-1)} disabled={deckIndex === 0} aria-label="Previous quest">‹</button>
              <div>{visible.map((quest, index) => <button key={quest.id} type="button" className={index === deckIndex ? 'active' : ''} onClick={() => setDeckIndex(index)} aria-label={`Show ${quest.title}`} />)}</div>
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
            <button className="gold-button" type="button" onClick={() => accept(tab)}>Generate {tab} quests</button>
          </section>
        )}

        <section className="mobile-available-rail">
          <div className="section-title"><h2>Available Quests</h2><span>Swipe to explore</span></div>
          <div>
            {definitions.map((quest) => (
              <article key={quest.id}>
                <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                <strong>{quest.title}</strong>
                <small>{quest.description}</small>
                <span>{quest.xpReward} XP</span>
                <button type="button" onClick={() => accept(quest.cadence)} disabled={generateDaily.isPending || generateWeekly.isPending || generateMonthly.isPending}>Accept</button>
              </article>
            ))}
            {!definitionsQuery.isLoading && definitions.length === 0 && <p className="empty-state">Every available quest is already active.</p>}
          </div>
        </section>
      </section>

      <section className="focus-hero ornate-panel">
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
          <div className="gold-progress" role="progressbar" aria-valuenow={Math.round(featuredRatio * 100)} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${featuredRatio * 100}%` }} /></div>
          <blockquote>Knowledge is a blade. Sharpen it.</blockquote>
        </div>
        <div className="character-dialogue"><Icon name="leaf" /><span>Every step forward brings you closer to legend. Keep going!</span></div>
      </section>

      <div className="quest-tabs" role="tablist" aria-label="Quest cadence">
        {tabs.map((item) => (
          <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            <Icon name={item.icon} /><span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="quest-content-grid">
          <section className="ornate-panel active-list">
            <div className="section-title"><h2>Active Quests</h2><span>{visible.length} active</span></div>
            {visible.length === 0 && (
              <div className="empty-state"><Icon name="scroll" /><p>No {tab} quests yet.</p><button className="gold-button" type="button" onClick={() => accept(tab)}>Generate {tab} quests</button></div>
            )}
            {visible.map((quest) => (
              <button key={quest.id} type="button" className="reference-quest-row" onClick={() => setSelectedId(quest.id)}>
                <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
                <span className="quest-copy"><strong>{quest.title}</strong><small>{quest.description}</small><span className="gold-progress"><i style={{ width: `${questProgressRatio(quest) * 100}%` }} /></span></span>
                <span className="quest-numbers"><b>{quest.progressValue}/{quest.targetValue}</b><span>XP<br /><strong>{quest.xpReward}</strong></span></span>
              </button>
            ))}
          </section>
          <aside className="progress-side">
            <section className="ornate-panel streak-card"><h2>Weekly Streak</h2><Icon name="flame" /><strong>{me.streakDays || 0}</strong><span>days</span><p>Keep the flame alive!</p></section>
            <section className="ornate-panel rank-card"><h2>Path Rank</h2><Icon name="compass" /><strong>{presentation.rank}</strong><div className="gold-progress"><i style={{ width: `${presentation.rankProgress * 100}%` }} /></div><span>{me.totalXp.toLocaleString()} / {presentation.nextRankXp.toLocaleString()} XP</span></section>
          </aside>
      </div>

      <section className="ornate-panel available-quests">
        <div className="section-title"><h2>Available Quests</h2><span>⌛ New quests in {resetLabel()}</span></div>
        {definitionsQuery.isLoading && <p role="status">Consulting the quest archive…</p>}
        <div className="available-grid">
          {definitions.map((quest) => (
            <article key={quest.id} className="available-card">
              <span className="round-emblem"><Icon name={categoryIcon(quest.category)} /></span>
              <h3>{quest.title}</h3><p>{quest.description}</p>
              <div><span>◈ {quest.xpReward} XP</span><span>{quest.cadence}</span></div>
              <button className="gold-button" type="button" onClick={() => accept(quest.cadence)} disabled={generateDaily.isPending || generateWeekly.isPending || generateMonthly.isPending}>Accept Quest</button>
            </article>
          ))}
          {!definitionsQuery.isLoading && definitions.length === 0 && <p className="empty-state">All currently available quests are already on your board.</p>}
        </div>
      </section>

      {selected && <div className="quest-detail-overlay" role="dialog" aria-modal="true" aria-label={`${selected.title} details`} onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}><div><button className="detail-close" type="button" onClick={() => setSelectedId(null)} aria-label="Close quest details">×</button><QuestDetail quest={selected} /></div></div>}
      {notice && <div className="toast-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
    </main>
  );
}

export function PlayerHeader({ me, page }) {
  return (
    <header className="reference-header">
      <div className="avatar-medallion"><span>{(me.displayName || 'S')[0].toUpperCase()}</span><b>{me.level}</b></div>
      <div className="player-heading"><h1>{page}</h1><p>{me.displayName || 'Mind in progress'} <i /></p><span><Icon name="shield" /> {me.totalXp.toLocaleString()} XP</span></div>
      <div className="header-orbit"><button type="button" aria-label="Notifications" onClick={() => window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'No new notices. Your path is clear.' }))}><Icon name="bell" /></button><button type="button" aria-label="Open path compass" onClick={() => window.dispatchEvent(new CustomEvent('habbit-notice', { detail: `Your current path rank is ${me.tier || 'Novice'}.` }))}><Icon name="compass" /></button></div>
    </header>
  );
}

function QuestSkeleton() {
  return <main className="quest-reference" aria-busy="true"><div className="skeleton player-skeleton" /><div className="skeleton hero-skeleton" /><div className="skeleton list-skeleton" /><p className="sr-only" role="status">Loading your quest journal…</p></main>;
}
