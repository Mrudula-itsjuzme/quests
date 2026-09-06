const DEFAULT_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export function createScenicPlacesProvider({ fetchImpl = globalThis.fetch, endpoint = process.env.OVERPASS_API_URL || DEFAULT_ENDPOINT } = {}) {
  return async function findScenicPlaces({ lat, lng, radius = 5000, limit = 20 }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const query = `[out:json][timeout:6];(
      nwr(around:${radius},${lat},${lng})[tourism~"^(attraction|viewpoint|museum|gallery|artwork|picnic_site)$"];
      nwr(around:${radius},${lat},${lng})[historic];
      nwr(around:${radius},${lat},${lng})[leisure~"^(park|nature_reserve|garden)$"];
      nwr(around:${radius},${lat},${lng})[natural~"^(waterfall|peak|beach|spring)$"];
    );out center tags;`;
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'WildRealm/1.0 scenic-place-search' },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`overpass_${response.status}`);
      const payload = await response.json();
      return (payload.elements || []).map(mapElement).filter(Boolean).slice(0, limit);
    } finally {
      clearTimeout(timeout);
    }
  };
}

function mapElement(element) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !tags.name) return null;
  const category = scenicCategory(tags);
  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    category,
    description: tags.description || tags['description:en'] || scenicDescription(category),
    region: tags['addr:city'] || tags['addr:suburb'] || tags['addr:district'] || 'Nearby',
    gps: { lat, lng },
    source: 'openstreetmap',
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    attribution: '© OpenStreetMap contributors',
  };
}

function scenicCategory(tags) {
  if (tags.natural === 'waterfall') return 'Waterfalls';
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve') return 'Parks';
  if (tags.tourism === 'viewpoint' || tags.natural === 'peak' || tags.natural === 'beach') return 'Viewpoints';
  if (tags.historic || ['museum', 'gallery', 'artwork'].includes(tags.tourism)) return 'Culture';
  return 'Hotspots';
}

function scenicDescription(category) {
  if (category === 'Culture') return 'A nearby cultural or heritage place to explore.';
  if (category === 'Viewpoints') return 'A scenic place mapped by OpenStreetMap contributors.';
  return 'A nearby place worth exploring, mapped by OpenStreetMap contributors.';
}
