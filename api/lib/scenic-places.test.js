import { describe, expect, it, vi } from 'vitest';
import { createScenicPlacesProvider } from './scenic-places.js';

describe('scenic places provider', () => {
  it('maps named OpenStreetMap elements into explore places', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ elements: [
      { type: 'node', id: 42, lat: 12.9, lon: 77.6, tags: { name: 'Hill View', tourism: 'viewpoint' } },
      { type: 'node', id: 43, lat: 12.8, lon: 77.5, tags: { tourism: 'viewpoint' } },
    ] }) });
    const find = createScenicPlacesProvider({ fetchImpl, endpoint: 'https://example.test/overpass' });
    const places = await find({ lat: 12.9, lng: 77.6, radius: 1000 });
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ id: 'osm-node-42', name: 'Hill View', category: 'Viewpoints', source: 'openstreetmap' });
    expect(fetchImpl).toHaveBeenCalledWith('https://example.test/overpass', expect.objectContaining({ method: 'POST' }));
  });
});
