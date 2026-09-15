import { describe, expect, it, vi } from 'vitest';
import { createProviders } from './providers.js';

describe('provider contracts', () => {
  const httpProvider = (fetchImpl, overrides = {}) => createProviders({
    mode: 'http',
    aiVerifyUrl: 'https://verify.example.com/v1/proofs',
    providerSecret: 'provider-secret-value',
    fetchImpl,
    timeoutMs: 1_000,
    maxRetries: 1,
    ...overrides,
  });

  it('keeps local clock, scheduler, health, and cache deterministic and bounded', async () => {
    const instant = new Date('2026-07-13T10:00:00.000Z');
    const providers = createProviders({ mode: 'local', now: () => new Date(instant) });
    expect(providers.clock.now()).toEqual(instant);
    const callback = vi.fn(() => ({ status: 'ran' }));
    expect(await providers.scheduler.tick(callback)).toEqual({ status: 'ran' });
    expect(callback).toHaveBeenCalledWith(instant);
    expect(await providers.health.readMetric({ value: '42' })).toBe(42);
    await expect(providers.health.readMetric({ value: -1 })).rejects.toMatchObject({ code: 'invalid_health_metric' });
    for (let index = 0; index < 501; index += 1) providers.cache.set(`key-${index}`, index);
    expect(providers.cache.get('key-0')).toBeUndefined();
    expect(providers.cache.get('key-500')).toBe(500);
  });

  it('accepts only opaque local uploads and returns normalized photo decisions', async () => {
    const providers = createProviders({ mode: 'local' });
    await expect(providers.storage.resolveUpload('../../etc/passwd')).rejects.toMatchObject({ code: 'invalid_upload_reference' });
    await expect(providers.storage.resolveUpload('https://attacker.example/image')).rejects.toMatchObject({ code: 'invalid_upload_reference' });
    const upload = await providers.storage.resolveUpload('local_abcdefgh');
    expect(upload).toEqual({ uploadId: 'local_abcdefgh', objectKey: 'local/local_abcdefgh' });
    const decision = await providers.photo.verify({ uploadId: upload.uploadId, subjectTag: 'flower' });
    expect(decision).toEqual({ confidence: 0.8, imageHash: expect.stringMatching(/^[a-f0-9]{64}$/), decision: 'approved' });
    expect(decision).not.toHaveProperty('rawResponse');
  });

  it('fails every sensitive production adapter closed when disabled', async () => {
    const providers = createProviders({ mode: 'disabled' });
    await expect(providers.health.readMetric({ value: 1 })).rejects.toMatchObject({ code: 'provider_not_configured', provider: 'health' });
    await expect(providers.storage.resolveUpload('local_abcdefgh')).rejects.toMatchObject({ code: 'provider_not_configured', provider: 'storage' });
    await expect(providers.photo.verify({ uploadId: 'local_abcdefgh' })).rejects.toMatchObject({ code: 'provider_not_configured', provider: 'photo' });
    expect(await providers.scheduler.tick()).toEqual({ status: 'disabled' });
  });

  it('authenticates the HTTP verifier and accepts success and low-confidence rejection results', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ confidence: 0.91, perceptualHash: 'hash_success_123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ confidence: 0.12, perceptualHash: 'hash_reject_123' }) });
    const provider = httpProvider(fetchImpl);

    await expect(provider.photo.verify({ uploadId: 'uploads/photo-1', subjectTag: 'fern' })).resolves.toMatchObject({ confidence: 0.91 });
    await expect(provider.photo.verify({ uploadId: 'uploads/photo-2', subjectTag: 'fern' })).resolves.toMatchObject({ confidence: 0.12 });
    expect(fetchImpl.mock.calls[0][1].headers.authorization).toBe('Bearer provider-secret-value');
  });

  it('retries transient verifier failures once and then fails closed', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(httpProvider(fetchImpl).photo.verify({ uploadId: 'uploads/photo-1' })).rejects.toMatchObject({ code: 'provider_unavailable' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports verifier timeout without awarding a result', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const fetchImpl = vi.fn().mockRejectedValue(timeout);
    await expect(httpProvider(fetchImpl).photo.verify({ uploadId: 'uploads/photo-1' })).rejects.toMatchObject({ code: 'provider_timeout' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed verifier responses and missing production configuration', async () => {
    const malformed = httpProvider(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ confidence: 2, perceptualHash: 'x' }) }));
    await expect(malformed.photo.verify({ uploadId: 'uploads/photo-1' })).rejects.toMatchObject({ code: 'invalid_verification_response' });
    const missing = createProviders({ mode: 'http', fetchImpl: vi.fn() });
    await expect(missing.photo.verify({ uploadId: 'uploads/photo-1' })).rejects.toMatchObject({ code: 'provider_not_configured' });
  });
});
