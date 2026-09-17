import { describe, expect, it } from 'vitest';
import { normalizeTimezone } from './api';

describe('normalizeTimezone', () => {
  it('canonicalizes legacy Android timezone aliases', () => {
    expect(normalizeTimezone('Asia/Calcutta')).toBe('Asia/Kolkata');
  });

  it('trims user-editable timezone input and falls back to UTC', () => {
    expect(normalizeTimezone(' Asia/Kolkata ')).toBe('Asia/Kolkata');
    expect(normalizeTimezone('')).toBe('UTC');
  });
});

describe('request recovery', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('times out a stalled response body and aborts its transport', async () => {
    vi.useFakeTimers();
    let transportSignal;
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      transportSignal = options.signal;
      return { ok: true, status: 200, json: () => new Promise(() => {}) };
    }));
    const { createApiClient } = await import('./api');
    const result = createApiClient(async () => 'test-token').getMe();
    const check = expect(result).rejects.toMatchObject({ code: 'request_timeout' });
    await vi.advanceTimersByTimeAsync(20_000);
    await check;
    expect(transportSignal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves cancellation instead of reporting a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { createApiClient } = await import('./api');
    const controller = new AbortController();
    const result = createApiClient(async () => 'test-token').getMe(controller.signal);
    const check = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await check;
  });

  it('does not treat malformed successful responses as empty account data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); } })));
    const { createApiClient } = await import('./api');
    await expect(createApiClient(async () => 'test-token').getMe()).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
