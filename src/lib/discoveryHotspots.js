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
