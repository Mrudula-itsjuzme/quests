import { Link } from 'react-router-dom';
import { Icon, categoryIcon } from '../../components/Icon';
import { useCollectibles } from '../quests/queries';

export function RewardsPage() {
  const { data = [], isLoading, isError } = useCollectibles();
  return (
    <main className="page-stack fantasy-page">
      <header className="reference-header compact-header">
        <div className="avatar-medallion"><Icon name="chest" /></div>
        <div><p className="eyebrow">RELIC VAULT</p><h1>Rewards</h1><p>Every verified quest leaves a mark on your story.</p></div>
      </header>
      <section className="ornate-panel rewards-vault">
        <div className="section-title"><h2>Collected Relics</h2><span>{data.length} unlocked</span></div>
        {isLoading && <p role="status">Opening the vault…</p>}
        {isError && <p role="alert">The vault could not be opened.</p>}
        {!isLoading && !isError && data.length === 0 && <div className="empty-state"><Icon name="chest" /><p>Complete a verified quest to unlock your first relic.</p></div>}
        <div className="reward-grid">
          {data.slice(0, 8).map((item) => <article key={item.assetId} className="reward-tile"><Icon name={categoryIcon(item.category)} /><strong>{item.title}</strong><span>{item.rarity}</span></article>)}
        </div>
        <Link className="gold-button" to="/app/gallery">Open the full gallery</Link>
      </section>
    </main>
  );
}
