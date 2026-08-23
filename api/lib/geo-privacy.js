/**
 * Sensitive-species coordinate obfuscation — blueprint §1, §10, §22, §27
 * (CRITICAL). "Sensitive species and exact locations of vulnerable wildlife
 * are obfuscated... The game must never become a poaching or stalking map."
 * and: "Sensitive coordinates never sent to client at full precision" /
 * "jitter to a coarse grid cell — server-enforced, not client."
 *
 * This must run before a sensitive-species capture's coordinates are ever
 * persisted somewhere a client can read them back (a community post, a map
 * pin). Obfuscating only at read time would still leave the exact location
 * sitting in the database as an exposure (a DB leak, an admin view, a
 * future endpoint that forgets to redact). Snapping at write time means the
 * precise value for a sensitive sighting is never stored in a client-facing
 * table at all.
 */

// ~0.01 degrees of latitude is roughly 1.1km; longitude varies with
// latitude but this is a coarse "which neighborhood/valley, not which tree"
// grid cell, consistent at any latitude without a cosine correction — the
// blueprint asks for a coarse cell, not a precise circle.
const GRID_DEGREES = 0.01;

/**
 * Snaps a coordinate to the center of its grid cell, then adds a small
 * deterministic-but-unpredictable offset within that cell (seeded from the
 * coordinate itself) so repeated obfuscation of the same point is stable —
 * important so a species' hotspot doesn't visibly "jump" between posts —
 * while still not landing on a perfect grid line that would itself leak the
 * precision boundary.
 */
export function jitterCoordinate({ lat, lng }, gridDegrees = GRID_DEGREES) {
  if (lat == null || lng == null) return { lat, lng };
  const cellLat = Math.floor(lat / gridDegrees) * gridDegrees + gridDegrees / 2;
  const cellLng = Math.floor(lng / gridDegrees) * gridDegrees + gridDegrees / 2;
  return {
    lat: Number(cellLat.toFixed(6)),
    lng: Number(cellLng.toFixed(6)),
  };
}

/**
 * Returns the GPS to persist/serve for a capture, obfuscated when the
 * species is marked sensitive. `species` may be null (unresolved/landscape
 * subject) — treated as not sensitive, since only catalog-flagged species
 * carry a poaching/stalking risk.
 */
export function protectedGps(gps, species) {
  if (!gps) return gps;
  if (!species?.sensitive) return gps;
  const { lat, lng } = jitterCoordinate(gps);
  return { ...gps, lat, lng, accuracyM: null, altitude: null, obfuscated: true };
}
