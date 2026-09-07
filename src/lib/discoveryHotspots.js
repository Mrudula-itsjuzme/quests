/**
 * Derives map hotspots from the player's own capture history.
 *
 * There is no places/POI provider wired into this project, so rather than
 * shipping a hardcoded list of parks and waterfalls that would be fiction for
 * every user, the Explore map surfaces the places the player has actually
 * discovered things. Captures within ~1.1km of each other (0.01 degrees) are
 * treated as one location.
 */

const CLUSTER_PRECISION = 2; // decimal degrees ≈ 1.1 km

// Element drives the category filter, so "Birding" et al. filter real data.
const CATEGORY_BY_ELEMENT = {
  Sky: 'Birding',
  Water: 'Waterfalls',
  Grass: 'Parks',
  Earth: 'Parks',
  Fire: 'Hotspots',
};

const RARITY_ORDER = ['S', 'A', 'B', 'C', 'D'];

function cellKey(lat, lng) {
  return `${lat.toFixed(CLUSTER_PRECISION)},${lng.toFixed(CLUSTER_PRECISION)}`;
}

function bestGrade(cards) {
  return cards
    .map((card) => (card.rarityGrade || card.rarityTier || 'D').toUpperCase())
    .sort((left, right) => RARITY_ORDER.indexOf(left) - RARITY_ORDER.indexOf(right))[0] || 'D';
}

/** Great-circle distance in kilometres. */
export function distanceKm(from, to) {
  if (!from || !to) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistance(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/**
 * Curated hotspots from /api/v1/world/hotspots, shaped like capture clusters
 * so the map and the nearby list can render one merged collection.
 */
export function mapCuratedHotspots(hotspots = [], origin = null) {
  return (hotspots || [])
    .filter((item) => item?.gps && Number.isFinite(item.gps.lat) && Number.isFinite(item.gps.lng))
    .map((item) => {
      const km = distanceKm(origin, item.gps);
      return {
        id: item.id,
        title: item.name,
        category: item.category,
        description: item.description,
        imageRef: item.imageRef || imageForCategory(item.category),
        region: item.region,
        featuredSpecies: item.featuredSpecies || [],
        source: item.source || 'curated',
        sourceUrl: item.sourceUrl,
        attribution: item.attribution,
        saved: Boolean(item.saved),
        saveCount: Number(item.saveCount || 0),
        rating: item.rating == null ? null : Number(item.rating),
        ratingCount: Number(item.ratingCount || 0),
        viewerRating: item.viewerRating == null ? null : Number(item.viewerRating),
        gps: item.gps,
        distanceKm: km,
        distanceLabel: formatDistance(km),
        x: ((item.gps.lng + 180) / 360) * 100,
        y: ((90 - item.gps.lat) / 180) * 100,
      };
    });
}

function imageForCategory(category) {
  const key = String(category || '').toLowerCase();
  if (key.includes('bird')) return '/assets/blue-billed-cuckoo.png';
  if (key.includes('water')) return '/assets/verdant-explorer-banner.png';
  if (key.includes('park')) return '/assets/verdant-explorer-banner.png';
  return '/assets/quest-compass-poster.png';
}

/**
 * Merges curated world hotspots with the player's own discovery clusters into
 * the single list the Explore map renders, nearest first.
 */
export function mergeHotspots(curated = [], discovered = []) {
  return [...curated, ...discovered].sort(
    (left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity),
  );
}

/** Groups privacy-redacted public posts into photo-backed community hotspots. */
export function buildCommunityHotspots(posts = [], origin = null) {
  const clusters = new Map();
  for (const post of posts || []) {
    if (!post?.gps || !post.discovery?.imageRef) continue;
    const key = cellKey(post.gps.lat, post.gps.lng);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(post);
  }
  return [...clusters.entries()].map(([key, entries]) => {
    const first = entries[0];
    const lat = entries.reduce((sum, item) => sum + item.gps.lat, 0) / entries.length;
    const lng = entries.reduce((sum, item) => sum + item.gps.lng, 0) / entries.length;
    const km = distanceKm(origin, { lat, lng });
    return {
      id: `community-${key}`,
      title: first.placeLabel || first.discovery.cardTitle || first.discovery.itemName || 'Community hotspot',
      category: 'Community',
      description: `${entries.length} explorer photo${entries.length === 1 ? '' : 's'} shared here.`,
      source: 'community',
      discoveries: entries.length,
      contributor: first.author?.displayName || 'Explorer',
      imageRef: first.discovery.imageRef,
      gps: { lat, lng },
      distanceKm: km,
      distanceLabel: formatDistance(km),
    };
  });
}

/**
 * @param captures capture cards from /api/v1/captures
 * @param species  species catalog from /api/v1/species
 * @param origin   optional {lat,lng} to measure distance from
 */
export function buildDiscoveryHotspots(captures = [], species = [], origin = null) {
  const speciesById = new Map((species || []).map((entry) => [entry.id, entry]));
  const clusters = new Map();

  for (const card of captures || []) {
    if (!card?.gps || card.status === 'rejected') continue;
    const key = cellKey(card.gps.lat, card.gps.lng);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(card);
  }

  return [...clusters.entries()]
    .map(([key, cards]) => {
      const lat = cards.reduce((sum, card) => sum + card.gps.lat, 0) / cards.length;
      const lng = cards.reduce((sum, card) => sum + card.gps.lng, 0) / cards.length;
      const elements = cards.map((card) => speciesById.get(card.speciesId)?.element).filter(Boolean);
      const element = elements[0] || 'Earth';
      const km = distanceKm(origin, { lat, lng });
      return {
        id: key,
        title: cards.length === 1
          ? (cards[0].cardTitle || cards[0].itemName)
          : `${cards[0].cardTitle || cards[0].itemName} +${cards.length - 1}`,
        category: CATEGORY_BY_ELEMENT[element] || 'Hotspots',
        element,
        grade: bestGrade(cards),
        source: 'discovered',
        discoveries: cards.length,
        gps: { lat, lng },
        distanceKm: km,
        distanceLabel: formatDistance(km),
        // Normalised position for the world canvas overlay.
        x: ((lng + 180) / 360) * 100,
        y: ((90 - lat) / 180) * 100,
      };
    })
    .sort((left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity)
      || right.discoveries - left.discoveries);
}
