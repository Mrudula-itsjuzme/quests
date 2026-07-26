import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import {
  cosmeticOptions,
  derivePlayerPresentation,
  loadCosmetics,
  saveCosmetics,
} from '../../lib/playerPresentation';
import { PlayerHeader } from '../quests/QuestsPage';
import { useActiveQuests, useCollectibles, useMe, useQuestHistory } from '../quests/queries';

export function ProfilePage() {
  const meQuery = useMe();
  const activeQuery = useActiveQuests();
  const historyQuery = useQuestHistory();
  const collectionQuery = useCollectibles();
  const [cosmetics, setCosmetics] = useState(loadCosmetics);
  const [picker, setPicker] = useState(null);
  const [saved, setSaved] = useState('');

  useEffect(() => saveCosmetics(cosmetics), [cosmetics]);
  const presentation = useMemo(
    () => derivePlayerPresentation(meQuery.data, activeQuery.data || [], historyQuery.data || [], collectionQuery.data || []),
    [meQuery.data, activeQuery.data, historyQuery.data, collectionQuery.data],
  );

  if (meQuery.isLoading || activeQuery.isLoading || historyQuery.isLoading || collectionQuery.isLoading) {
    return <main className="profile-reference"><div className="skeleton player-skeleton" /><div className="skeleton profile-skeleton" /><p className="sr-only" role="status">Loading your profile…</p></main>;
  }
  if (meQuery.isError || activeQuery.isError || historyQuery.isError || collectionQuery.isError) {
    return <section className="ornate-panel error-state" role="alert"><h2>Your journal could not be opened</h2><p>Please check the quest service and try again.</p></section>;
  }

  const me = meQuery.data;
  const history = historyQuery.data || [];
  const collectibles = collectionQuery.data || [];
  const xpRatio = me.xpForCurrentLevel ? me.xpIntoLevel / me.xpForCurrentLevel : 0;
  const choose = (key, value) => {
    setCosmetics((current) => ({ ...current, [key]: value }));
    setPicker(null);
    setSaved(`${value} equipped.`);
  };

  return (
    <main className="profile-reference fantasy-page">
      <PlayerHeader me={me} page="Profile" />
      <div className="profile-hero-grid">
        <section className="portrait-panel ornate-panel">
          <img className="profile-scholar-art" src="/quest-scholar-hero.png" alt="Scholar-adventurer overlooking a distant fantasy city" />
          <div className="portrait-caption"><Icon name="leaf" /><div><h2>{cosmetics.title}</h2><p>Wander. Discover. Become.</p></div></div>
        </section>
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
          <section className="ornate-panel guild-banner"><Icon name="shield" /><div><span>Guild</span><h2>Unsworn Wayfarer</h2><p>Guild membership is not connected yet.</p></div><button type="button" onClick={() => setSaved('Guild invitations are not available yet.')} aria-label="View guild status">›</button></section>
          <section className="ornate-panel achievements"><h2>Achievements</h2><div>{presentation.achievements.map((item) => <article key={item.id} className={item.unlocked ? 'unlocked' : 'locked'}><span><Icon name={item.icon} /></span><small>{item.label}</small></article>)}</div></section>
        </div>
      </div>

      <div className="profile-detail-grid">
        <section className="ornate-panel history-panel">
          <div className="section-title"><h2>Quest History</h2><span>{history.length}</span></div>
          {history.slice(0, 4).map((quest) => <article key={quest.id}><div><strong>{quest.title}</strong><span>{quest.status === 'completed' ? 'Completed' : quest.status}</span></div><time>{quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : 'Recently'}</time></article>)}
          {history.length === 0 && <p className="empty-state">Your completed quests will be recorded here.</p>}
        </section>
        <section className="ornate-panel banner-panel">
          <div className="section-title"><h2>Equipped Title & Banner</h2><button type="button" onClick={() => setPicker('banner')} aria-label="Change banner"><Icon name="gear" /></button></div>
          <div className="equipped-banner"><Icon name="compass" /></div><h3>{cosmetics.title}</h3><p>{cosmetics.banner} standard</p>
          <button type="button" className="gold-button" onClick={() => setPicker('title')}>Change Title</button>
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
        <section className="ornate-panel gear-preview"><h2>Gear Preview</h2><div>{cosmeticOptions.gear.map((item, index) => <button type="button" key={item} className={cosmetics.gear === item ? 'selected' : ''} onClick={() => choose('gear', item)} aria-label={`Equip ${item}`}><Icon name={['leaf', 'shield', 'star', 'compass', 'gear'][index]} /><span>{item}</span></button>)}</div></section>
        <section className="ornate-panel customisation"><h2>Customisation</h2><div>{['appearance', 'outfit', 'mount', 'companion'].map((key) => <button type="button" key={key} onClick={() => setPicker(key)}><Icon name={key === 'mount' ? 'compass' : key === 'companion' ? 'star' : 'user'} /><span>{key}</span><small>{cosmetics[key]}</small></button>)}</div></section>
      </div>

      {picker && <SelectionSheet title={`Choose ${picker}`} options={cosmeticOptions[picker]} selected={cosmetics[picker]} onChoose={(value) => choose(picker, value)} onClose={() => setPicker(null)} />}
      {saved && <div className="toast-notice" role="status"><span>{saved}</span><button type="button" onClick={() => setSaved('')} aria-label="Dismiss notification">×</button></div>}
    </main>
  );
}

function ProfileStat({ icon, label, value }) {
  return <article><Icon name={icon} /><span>{label}</span><strong>{value}</strong></article>;
}

function StatRow({ label, value }) {
  return <div className="stat-row"><span>{label}</span><strong>{value}</strong></div>;
}

function SelectionSheet({ title, options, selected, onChoose, onClose }) {
  return <div className="selection-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="selection-sheet ornate-panel"><div className="section-title"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></div>{options.map((item) => <button type="button" key={item} className={selected === item ? 'selected' : ''} onClick={() => onChoose(item)}>{item}<span>{selected === item ? 'Equipped' : 'Select'}</span></button>)}</section></div>;
}
