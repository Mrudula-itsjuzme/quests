import { describe, expect, it, vi } from 'vitest';
import { createProviders } from './providers.js';

describe('provider contracts', () => {
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
});
