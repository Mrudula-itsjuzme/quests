import { AnimatedCollectible } from '../../components/AnimatedCollectible';
import { categoryColors } from '../../components/Icon';
import { useCollectibles } from '../quests/queries';

export function GalleryPage() {
  const { data: collection, isLoading, isError } = useCollectibles();

  return (
    <main className="gallery-shell page-stack">
      <div className="page-heading">
        <div>
          <h1>Gallery</h1>
          <p>Collectible archive for every reward your account has actually unlocked.</p>
        </div>
      </div>

      {isLoading && <p role="status">Loading your collection...</p>}
      {isError && (
        <section className="panel" role="alert">
          <p>Could not load your collection right now.</p>
        </section>
      )}

      {!isLoading && !isError && (!collection || collection.length === 0) && (
        <section className="panel empty-gallery">
          <AnimatedCollectible collectible={{ category: 'Discovery' }} preview />
          <h2>No stickers unlocked yet</h2>
          <p>Complete a quest to send the first animated asset into this gallery.</p>
        </section>
      )}

      {!isLoading && !isError && collection && collection.length > 0 && (
        <section className="collection-grid" aria-label="Unlocked collectible gallery">
          {collection.map((item) => (
            <article className="panel collection-card" key={item.assetId}>
              <AnimatedCollectible collectible={item} />
              <span className={`pill ${categoryColors[item.category]}`}>{item.category}</span>
              <h2>{item.title}</h2>
              <p>{item.caption}</p>
              <small>{item.rarity} asset</small>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
