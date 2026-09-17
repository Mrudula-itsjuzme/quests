import { describe, expect, it, vi } from 'vitest';
import { OpenRouterVisionProvider, VisionClassificationError } from './vision-providers.js';

function response(content, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => ({ choices: [{ message: { content } }] }) };
}

function provider(fetchImpl, overrides = {}) {
  return new OpenRouterVisionProvider({
    apiKey: 'openrouter-test-key',
    fetchImpl,
    timeoutMs: 1_000,
    maxRetries: 1,
    ...overrides,
  });
}

describe('OpenRouter vision provider', () => {
  it('authenticates requests and returns normalized candidates', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(JSON.stringify({ candidates: [{
      commonName: ' Fern ', scientificName: null, category: 'Flora', element: 'Grass', confidence: 0.92,
    }] })));
    await expect(provider(fetchImpl).identify('data:image/jpeg;base64,abc')).resolves.toEqual({ candidates: [expect.objectContaining({ commonName: 'Fern', confidence: 0.92 })] });
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer openrouter-test-key');
  });

  it('retries provider-unavailable responses once and fails closed', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response('', { ok: false, status: 503 }));
    await expect(provider(fetchImpl).identify('image')).rejects.toMatchObject({ code: 'vision_provider_unavailable' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('surfaces timeouts after bounded retries', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const fetchImpl = vi.fn().mockRejectedValue(timeout);
    await expect(provider(fetchImpl).identify('image')).rejects.toMatchObject({ code: 'vision_provider_timeout' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed responses and absent credentials', async () => {
    const malformed = provider(vi.fn().mockResolvedValue(response('{"candidates":[{"category":"Flora","element":"Grass","confidence":0.9}]}')));
    await expect(malformed.identify('image')).rejects.toMatchObject({ code: 'vision_provider_invalid_response' });
    await expect(new OpenRouterVisionProvider().identify('image')).rejects.toEqual(new VisionClassificationError('vision_provider_not_configured'));
  });
});
