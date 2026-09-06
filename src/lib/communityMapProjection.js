// Pure positioning for the community "Places" map. Kept side-effect free so the
// geometry is unit-testable and shared by any surface that plots discoveries.
//
// The map is deliberately abstract (no tile provider), so instead of a
// whole-world projection — where an entire metro collapses into one pixel —
// we fit the canvas to the discoveries themselves: markers are positioned
// proportionally inside the lat/lng bounds with equal padding on every side.
// Markers that would overlap at render scale are clustered into a single count
// badge so genuinely co-located posts don't stack invisibly.

const MAX_LAT = 85;
const MAX_LNG = 180;
// Markers are 12px dots on a roughly 2:1 canvas, so one marker diameter is
// ~3.4% of the width and ~6.8% of the height. Markers whose centers fall
// within those bounds overlap visually and are clustered into a count badge.
// Distance-based (rather than grid-cell) clustering avoids boundary artifacts
// where near-identical positions straddle a rounding edge.
const CLUSTER_X_PERCENT = 3.5;
const CLUSTER_Y_PERCENT = 7;

function clamp(value, max) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-max, Math.min(max, value));
}

function hasValidGps(post) {
  return Boolean(post?.gps) && Number.isFinite(post.gps.lat) && Number.isFinite(post.gps.lng);
}

/**
 * @param {Array<{id: string, gps?: {lat: number, lng: number}}>} posts
 * @returns {{glowX: number, glowY: number, clusters: Array<{x: number, y: number, posts: Array}>}}
 */
export function projectCommunityMarkers(posts) {
  const located = (posts || []).filter(hasValidGps);
  if (located.length === 0) {
    return { glowX: 50, glowY: 50, clusters: [] };
  }

  const lats = located.map((post) => clamp(post.gps.lat, MAX_LAT));
  const lngs = located.map((post) => clamp(post.gps.lng, MAX_LNG));
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // Equal padding on each side keeps a lone marker centred and stops edge
  // points touching the frame. The 0.02° floor makes a single point a
  // well-defined 50/50 rather than a degenerate zero-span.
  const padLat = Math.max((maxLat - minLat) * 0.22, 0.02);
  const padLng = Math.max((maxLng - minLng) * 0.22, 0.02);
  minLat -= padLat;
  maxLat += padLat;
  minLng -= padLng;
  maxLng += padLng;
  const spanLat = Math.max(maxLat - minLat, 1e-9);
  const spanLng = Math.max(maxLng - minLng, 1e-9);

  const positioned = located.map((post) => ({
    post,
    x: ((clamp(post.gps.lng, MAX_LNG) - minLng) / spanLng) * 100,
    y: ((maxLat - clamp(post.gps.lat, MAX_LAT)) / spanLat) * 100,
  }));

  // Union-find over marker pairs: merge any two markers that would overlap at
  // render scale, so genuinely co-located posts share one count badge instead
  // of stacking invisibly.
  const parent = positioned.map((_, index) => index);
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const union = (a, b) => { parent[find(a)] = find(b); };
  for (let i = 0; i < positioned.length; i += 1) {
    for (let j = i + 1; j < positioned.length; j += 1) {
      if (
        Math.abs(positioned[i].x - positioned[j].x) <= CLUSTER_X_PERCENT &&
        Math.abs(positioned[i].y - positioned[j].y) <= CLUSTER_Y_PERCENT
      ) {
        union(i, j);
      }
    }
  }
  const byRoot = new Map();
  for (let i = 0; i < positioned.length; i += 1) {
    const root = find(i);
    const group = byRoot.get(root);
    if (group) group.push(positioned[i]);
    else byRoot.set(root, [positioned[i]]);
  }

  const clusters = Array.from(byRoot.values()).map((group) => ({
    // Centre the badge on the group's mean so it sits between members.
    x: group.reduce((sum, item) => sum + item.x, 0) / group.length,
    y: group.reduce((sum, item) => sum + item.y, 0) / group.length,
    posts: group.map((item) => item.post),
  }));

  return {
    glowX: ((minLng + maxLng) / 2 - minLng) / spanLng * 100,
    glowY: (maxLat - (minLat + maxLat) / 2) / spanLat * 100,
    clusters,
  };
}