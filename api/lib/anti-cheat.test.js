import { describe, expect, it } from 'vitest';
import { antiCheatVerdict, GateVerdict } from './anti-cheat.js';
import { MemoryQuestRepository } from './memory-repository.js';

const userId = '00000000-0000-4000-8000-000000000001';

function context(overrides = {}) {
  return {
    repository: new MemoryQuestRepository(),
    userId,
    serverReceivedAt: new Date('2026-07-13T10:00:00.000Z'),
    ...overrides,
  };
}

function bundle(overrides = {}) {
  return {
    capturedAt: '2026-07-13T09:59:50.000Z',
    gps: { lat: 12.9, lng: 77.6, accuracyM: 10 },
    heading: 90,
    liveness: { attested: true, method: 'capture-input-environment', score: 0.7 },
    imageHash: 'a'.repeat(16),
    ...overrides,
  };
}

describe('antiCheatVerdict', () => {
  it('passes a clean, well-attested capture', async () => {
    const result = await antiCheatVerdict(bundle(), context());
    expect(result.verdict).toBe(GateVerdict.PASS);
    expect(result.reason).toBeNull();
  });

  it('honestly reports which detectors are not yet implemented, so a PASS is never mistaken for a real check', async () => {
    const result = await antiCheatVerdict(bundle(), context());
    expect(result.unimplementedDetectors).toEqual(expect.arrayContaining(['screenshot', 'ai_generated', 'printed_photo']));
    for (const detector of result.results.filter((entry) => result.unimplementedDetectors.includes(entry.detector))) {
      expect(detector.implemented).toBe(false);
      expect(detector.verdict).toBe('PASS');
    }
  });

  it('flags an unattested liveness signal instead of rejecting outright', async () => {
    const result = await antiCheatVerdict(bundle({ liveness: { attested: false } }), context());
    expect(result.verdict).toBe(GateVerdict.PASS_WITH_REVIEW);
    expect(result.reason).toBe('not_attested');
  });

  it('flags a capture with no EXIF data as corroborating (not hard-fail) evidence', async () => {
    const result = await antiCheatVerdict(bundle({ exif: { hasExif: false } }), context());
    expect(result.verdict).toBe(GateVerdict.PASS_WITH_REVIEW);
    expect(result.reason).toBe('no_exif_data');
  });

  it('does not flag liveness when EXIF is present', async () => {
    const result = await antiCheatVerdict(bundle({ exif: { hasExif: true } }), context());
    expect(result.verdict).toBe(GateVerdict.PASS);
  });

  it('rejects a capturedAt timestamp far in the future alongside another flag (two soft flags = reject)', async () => {
    const result = await antiCheatVerdict(
      bundle({ capturedAt: '2026-07-14T10:00:00.000Z', liveness: { attested: false } }),
      context(),
    );
    expect(result.verdict).toBe(GateVerdict.REJECT);
    expect(result.reason).toBe('multiple_integrity_flags');
  });

  it('hard-rejects when the image hash matches another user\'s capture', async () => {
    const repository = new MemoryQuestRepository();
    await repository.createCapturedCard({ userId: 'other-user', imageHash: 'a'.repeat(16), itemName: 'x', category: 'Discovery', cardTitle: 'x', rarityTier: 'Bronze', rarityScore: 0.1 });
    const result = await antiCheatVerdict(bundle(), context({ repository }));
    expect(result.verdict).toBe(GateVerdict.REJECT);
    expect(result.reason).toBe('matches_existing_capture');
  });

  it('hard-rejects impossible travel between two captures', async () => {
    const repository = new MemoryQuestRepository();
    await repository.createCapturedCard({
      userId,
      itemName: 'x',
      category: 'Discovery',
      cardTitle: 'x',
      rarityTier: 'Bronze',
      rarityScore: 0.1,
      gps: { lat: 12.9, lng: 77.6 },
      capturedAt: '2026-07-13T09:59:55.000Z',
    });
    const result = await antiCheatVerdict(
      bundle({ gps: { lat: -33.9, lng: 151.2 }, capturedAt: '2026-07-13T10:00:00.000Z' }),
      context({ repository }),
    );
    expect(result.verdict).toBe(GateVerdict.REJECT);
    expect(result.reason).toBe('velocity_exceeds_human_possible');
  });

  it('flags impossible travel when timestamps are out of order or identical', async () => {
    const repository = new MemoryQuestRepository();
    await repository.createCapturedCard({
      userId,
      itemName: 'x',
      category: 'Discovery',
      cardTitle: 'x',
      rarityTier: 'Bronze',
      rarityScore: 0.1,
      gps: { lat: 12.9, lng: 77.6 },
      capturedAt: '2026-07-13T09:59:55.000Z',
    });
    const result = await antiCheatVerdict(
      bundle({ gps: { lat: 12.9, lng: 77.6 }, capturedAt: '2026-07-13T09:59:50.000Z' }), // Out of order
      context({ repository }),
    );
    expect(result.verdict).toBe(GateVerdict.PASS_WITH_REVIEW);
    expect(result.reason).toBe('negative_or_zero_elapsed_time');
  });

  it('passes when no prior capture location exists to compare against', async () => {
    const result = await antiCheatVerdict(bundle(), context());
    expect(result.verdict).toBe(GateVerdict.PASS);
  });

  it('tolerates a small clock skew between capturedAt and server receipt', async () => {
    const result = await antiCheatVerdict(bundle({ capturedAt: '2026-07-13T09:59:30.000Z' }), context());
    expect(result.verdict).toBe(GateVerdict.PASS);
  });
});
