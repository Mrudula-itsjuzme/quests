// @vitest-environment node
import { buildDiscoveryHotspots, distanceKm, formatDistance, mapCuratedHotspots, mergeHotspots } from './discoveryHotspots';

const species = [
  { id: 'sky-house-sparrow', element: 'Sky' },
  { id: 'earth-tiger', element: 'Earth' },
  { id: 'water-otter', element: 'Water' },
];

function capture(overrides = {}) {
  return {
    id: overrides.id || 'c1',
    itemName: 'House Sparrow',
    cardTitle: 'House Sparrow',
    speciesId: 'sky-house-sparrow',
    rarityGrade: 'C',
    status: 'final',
    gps: { lat: 12.9, lng: 77.6 },
    ...overrides,
  };
}

describe('buildDiscoveryHotspots', () => {
  it('returns nothing when there are no captures', () => {
    expect(buildDiscoveryHotspots([], species)).toEqual([]);
  });

  it('ignores captures without GPS and rejected captures', () => {
    const result = buildDiscoveryHotspots([
      capture({ id: 'a', gps: null }),
      capture({ id: 'b', status: 'rejected' }),
    ], species);
    expect(result).toEqual([]);
  });

  it('clusters nearby captures into a single hotspot', () => {
    const result = buildDiscoveryHotspots([
      capture({ id: 'a' }),
      capture({ id: 'b', gps: { lat: 12.9005, lng: 77.6005 } }),
    ], species);
    expect(result).toHaveLength(1);
    expect(result[0].discoveries).toBe(2);
    expect(result[0].title).toBe('House Sparrow +1');
  });

  it('keeps distant captures as separate hotspots', () => {
    const result = buildDiscoveryHotspots([
      capture({ id: 'a' }),
      capture({ id: 'b', gps: { lat: 20.1, lng: 80.4 } }),
    ], species);
    expect(result).toHaveLength(2);
  });

  it('reports the best rarity grade in a cluster', () => {
    const result = buildDiscoveryHotspots([
      capture({ id: 'a', rarityGrade: 'C' }),
      capture({ id: 'b', rarityGrade: 'S', gps: { lat: 12.9002, lng: 77.6002 } }),
      capture({ id: 'c', rarityGrade: 'B', gps: { lat: 12.9003, lng: 77.6003 } }),
    ], species);
    expect(result[0].grade).toBe('S');
  });

  it('maps element to the matching explore category', () => {
    const [sky] = buildDiscoveryHotspots([capture({ speciesId: 'sky-house-sparrow' })], species);
    const [earth] = buildDiscoveryHotspots([capture({ speciesId: 'earth-tiger' })], species);
    const [water] = buildDiscoveryHotspots([capture({ speciesId: 'water-otter' })], species);
    expect(sky.category).toBe('Birding');
    expect(earth.category).toBe('Parks');
    expect(water.category).toBe('Waterfalls');
  });

  it('omits distance when no origin position is known', () => {
    const [spot] = buildDiscoveryHotspots([capture()], species);
    expect(spot.distanceKm).toBeNull();
    expect(spot.distanceLabel).toBeNull();
  });

  it('sorts hotspots by distance from the player when a position is known', () => {
    const origin = { lat: 20.0, lng: 80.0 };
    const result = buildDiscoveryHotspots([
      capture({ id: 'far' }),
      capture({ id: 'near', gps: { lat: 20.05, lng: 80.05 } }),
    ], species, origin);
    expect(result[0].id.startsWith('20.05')).toBe(true);
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
  });
});

describe('mapCuratedHotspots', () => {
  const curated = [{
    id: 'demo-jog-falls',
    name: 'Jog Falls',
    category: 'Waterfalls',
    description: 'Four cascades.',
    gps: { lat: 14.2295, lng: 74.8126 },
    region: 'Karnataka, India',
    featuredSpecies: ['water-waterfall'],
    isDemo: true,
  }];

  it('shapes API hotspots for the map without losing their identity', () => {
    const [spot] = mapCuratedHotspots(curated);
    expect(spot.id).toBe('demo-jog-falls');
    expect(spot.title).toBe('Jog Falls');
    expect(spot.category).toBe('Waterfalls');
    expect(spot.source).toBe('curated');
    expect(spot.region).toBe('Karnataka, India');
  });

  it('projects latitude and longitude onto the correct canvas axes', () => {
    const [spot] = mapCuratedHotspots(curated);
    // x follows longitude, y follows latitude — swapping them would place
    // markers in the wrong hemisphere.
    expect(spot.x).toBeCloseTo(((74.8126 + 180) / 360) * 100, 6);
    expect(spot.y).toBeCloseTo(((90 - 14.2295) / 180) * 100, 6);
  });

  it('drops entries with missing or non-numeric coordinates', () => {
    expect(mapCuratedHotspots([
      { id: 'a', name: 'No GPS', category: 'Parks' },
      { id: 'b', name: 'Bad GPS', category: 'Parks', gps: { lat: null, lng: 12 } },
    ])).toEqual([]);
  });

  it('measures distance from the player when a position is known', () => {
    const [spot] = mapCuratedHotspots(curated, { lat: 14.2295, lng: 74.8126 });
    expect(spot.distanceKm).toBeCloseTo(0, 3);
    expect(spot.distanceLabel).toBe('0 m');
  });

  it('tolerates an absent hotspot list', () => {
    expect(mapCuratedHotspots(undefined)).toEqual([]);
  });
});

describe('mergeHotspots', () => {
  it('combines curated places with the player’s own clusters, nearest first', () => {
    const merged = mergeHotspots(
      [{ id: 'far', distanceKm: 40, source: 'curated' }],
      [{ id: 'near', distanceKm: 2, source: 'discovered' }],
    );
    expect(merged.map((item) => item.id)).toEqual(['near', 'far']);
  });

  it('keeps entries with unknown distance last rather than dropping them', () => {
    const merged = mergeHotspots(
      [{ id: 'unknown', distanceKm: null, source: 'curated' }],
      [{ id: 'known', distanceKm: 5, source: 'discovered' }],
    );
    expect(merged.map((item) => item.id)).toEqual(['known', 'unknown']);
  });

  it('returns curated content even when the player has captured nothing', () => {
    const merged = mergeHotspots([{ id: 'curated-only', distanceKm: null }], []);
    expect(merged).toHaveLength(1);
  });
});

describe('distance helpers', () => {
  it('measures a known separation', () => {
    // ~1 degree of latitude is roughly 111 km.
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
  });

  it('returns null without both endpoints', () => {
    expect(distanceKm(null, { lat: 1, lng: 1 })).toBeNull();
  });

  it('formats sub-kilometre distances in metres', () => {
    expect(formatDistance(0.42)).toBe('420 m');
    expect(formatDistance(3.14)).toBe('3.1 km');
    expect(formatDistance(42)).toBe('42 km');
  });
});
