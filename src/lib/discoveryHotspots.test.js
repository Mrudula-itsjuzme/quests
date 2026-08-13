// @vitest-environment node
import { buildDiscoveryHotspots, distanceKm, formatDistance } from './discoveryHotspots';

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
