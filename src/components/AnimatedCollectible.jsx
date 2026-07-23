import { categoryColors } from './Icon';

export function AnimatedCollectible({ collectible, preview = false }) {
  const category = categoryColors[collectible?.category] || 'discovery';
  return (
    <div className={`collectible-asset ${category} ${preview ? 'preview' : ''}`} aria-hidden="true">
      <div className="asset-card">
        <span className="asset-ear left" />
        <span className="asset-ear right" />
        <span className="asset-face" />
        <span className="asset-spark one" />
        <span className="asset-spark two" />
      </div>
    </div>
  );
}
