const GPS_FIELDS = new Set(['gps', 'coords', 'coordinates', 'position', 'geolocation']);
const PRIVATE_FIELDS = new Set([
  'email',
  'password',
  'token',
  'authorization',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'refreshToken',
  'gpsAccuracyM',
  'gpsAltitude',
]);

export function redactPublicPayload(value) {
  if (Array.isArray(value)) return value.map(redactPublicPayload);
  if (!value || typeof value !== 'object') return value;

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_FIELDS.has(key)) continue;
    if (GPS_FIELDS.has(key)) {
      output[key] = redactGps(child);
      continue;
    }
    output[key] = redactPublicPayload(child);
  }
  return output;
}

function redactGps(value) {
  if (!value || typeof value !== 'object') return value;
  const { lat, lng, obfuscated } = value;
  if (lat == null || lng == null) return null;
  return {
    lat: Number(lat),
    lng: Number(lng),
    obfuscated: Boolean(obfuscated),
  };
}
