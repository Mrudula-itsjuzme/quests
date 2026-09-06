// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { projectCommunityMarkers } from './communityMapProjection';

function post(overrides = {}) {
  return {
    id: overrides.id || 'p1',
    discovery: { itemName: 'Discovery', rarityStars: 3 },
    gps: { lat: 12.976, lng: 77.592 },
    ...overrides,
  };
}

describe('projectCommunityMarkers', () => {
  it('returns no clusters for empty or GPS-less input', () => {
    expect(projectCommunityMarkers([]).clusters).toEqual([]);
    expect(projectCommunityMarkers(undefined).clusters).toEqual([]);
    expect(projectCommunityMarkers([
      post({ id: 'a', gps: null }),
      post({ id: 'b', gps: { lat: null, lng: 12 } }),
    ]).clusters).toEqual([]);
  });

  it('centres a single marker on the canvas', () => {
    const { clusters } = projectCommunityMarkers([post({ id: 'solo' })]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].x).toBeCloseTo(50, 6);
    expect(clusters[0].y).toBeCloseTo(50, 6);
  });

  it('spreads a metro-area cluster into distinct markers instead of one dot', () => {
    // Cubbon Park, Hebbal Lake and Nandi Hills sit ~0.4° apart — the exact
    // case where a whole-world projection used to stack them into one pixel.
    const { clusters } = projectCommunityMarkers([
      post({ id: 'cubbon', gps: { lat: 12.976, lng: 77.592 } }),
      post({ id: 'hebbal', gps: { lat: 13.036, lng: 77.591 } }),
      post({ id: 'nandi', gps: { lat: 13.37, lng: 77.683 } }),
    ]);
    expect(clusters).toHaveLength(3);
    const xs = clusters.map((cluster) => cluster.x);
    const ys = clusters.map((cluster) => cluster.y);
    // Every pair must be visibly separated on both axes or at least one.
    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const apart = Math.abs(xs[i] - xs[j]) >= 1 || Math.abs(ys[i] - ys[j]) >= 1;
        expect(apart).toBe(true);
      }
    }
    // The northernmost point (Nandi) must sit higher on the canvas.
    const nandi = clusters.find((cluster) => cluster.posts[0].id === 'nandi');
    const cubbon = clusters.find((cluster) => cluster.posts[0].id === 'cubbon');
    expect(nandi.y).toBeLessThan(cubbon.y);
  });

  it('clusters posts at identical coordinates into one count badge', () => {
    const { clusters } = projectCommunityMarkers([
      post({ id: 'a', gps: { lat: 12.976, lng: 77.592 } }),
      post({ id: 'b', gps: { lat: 12.976, lng: 77.592 } }),
      post({ id: 'c', gps: { lat: 13.37, lng: 77.683 } }),
    ]);
    expect(clusters).toHaveLength(2);
    const stacked = clusters.find((cluster) => cluster.posts.length === 2);
    expect(stacked).toBeDefined();
    expect(stacked.posts.map((item) => item.id).sort()).toEqual(['a', 'b']);
  });

  it('clusters posts that project within the same pixel-sized cell', () => {
    const { clusters } = projectCommunityMarkers([
      post({ id: 'a', gps: { lat: 12.976, lng: 77.592 } }),
      // ~35 m north-west: far too close to separate at canvas scale.
      post({ id: 'b', gps: { lat: 12.9763, lng: 77.5917 } }),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].posts).toHaveLength(2);
  });

  it('clusters near-identical metro posts even when they straddle a grid boundary', () => {
    // Lyra and Nila both post from Nandi Hills summit (~30 m apart). These
    // coordinates sit across an integer-percent boundary under grid-cell
    // clustering; distance-based clustering must still merge them.
    const { clusters } = projectCommunityMarkers([
      post({ id: 'lyra', gps: { lat: 13.3702, lng: 77.6835 } }),
      post({ id: 'nila', gps: { lat: 13.37, lng: 77.683 } }),
      post({ id: 'far', gps: { lat: 12.8, lng: 77.56 } }),
    ]);
    expect(clusters).toHaveLength(2);
    const pair = clusters.find((cluster) => cluster.posts.length === 2);
    expect(pair).toBeDefined();
    expect(pair.posts.map((item) => item.id).sort()).toEqual(['lyra', 'nila']);
  });

  it('keeps clearly separate cities apart', () => {
    const { clusters } = projectCommunityMarkers([
      post({ id: 'bengaluru', gps: { lat: 12.976, lng: 77.592 } }),
      post({ id: 'tokyo', gps: { lat: 35.676, lng: 139.65 } }),
    ]);
    expect(clusters).toHaveLength(2);
  });

  it('tolerates extreme coordinates without producing NaN positions', () => {
    const { clusters } = projectCommunityMarkers([
      post({ id: 'north', gps: { lat: 90, lng: 0 } }),
      post({ id: 'south', gps: { lat: -90, lng: 0 } }),
    ]);
    expect(clusters).toHaveLength(2);
    for (const cluster of clusters) {
      expect(Number.isFinite(cluster.x)).toBe(true);
      expect(Number.isFinite(cluster.y)).toBe(true);
      expect(cluster.x).toBeGreaterThanOrEqual(0);
      expect(cluster.x).toBeLessThanOrEqual(100);
      expect(cluster.y).toBeGreaterThanOrEqual(0);
      expect(cluster.y).toBeLessThanOrEqual(100);
    }
  });

  it('exposes a finite glow centre for the background wash', () => {
    const { glowX, glowY } = projectCommunityMarkers([
      post({ id: 'a', gps: { lat: 12.976, lng: 77.592 } }),
    ]);
    expect(glowX).toBeCloseTo(50, 6);
    expect(glowY).toBeCloseTo(50, 6);
  });
});