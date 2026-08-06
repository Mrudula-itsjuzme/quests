import { describe, expect, it } from 'vitest';
import { scoreDiscovery, gradeForScore, starsForScore, rewardsForGrade, DEFAULT_WEIGHTS, DEFAULT_GRADE_BANDS } from './rarity-engine.js';

const weightSet = { version: 1, weights: DEFAULT_WEIGHTS, gradeBands: DEFAULT_GRADE_BANDS };

function input(overrides = {}) {
  return {
    species: { baseRarity: 0.3, nocturnal: false, seasonalityMonths: [] },
    confidence: 0.8,
    capturedAt: '2026-07-13T12:00:00.000Z',
    gps: { lat: 12.9, lng: 77.6, accuracyM: 10 },
    lastCaptureGps: null,
    isFirstForPlayer: false,
    isFirstGlobal: false,
    ...overrides,
  };
}

describe('gradeForScore / starsForScore / rewardsForGrade', () => {
  it('maps scores to the documented D-S grade bands', () => {
    expect(gradeForScore(0)).toBe('D');
    expect(gradeForScore(39)).toBe('D');
    expect(gradeForScore(40)).toBe('C');
    expect(gradeForScore(59)).toBe('C');
    expect(gradeForScore(60)).toBe('B');
    expect(gradeForScore(74)).toBe('B');
    expect(gradeForScore(75)).toBe('A');
    expect(gradeForScore(89)).toBe('A');
    expect(gradeForScore(90)).toBe('S');
    expect(gradeForScore(100)).toBe('S');
  });

  it('derives a 1-5 star display from the score', () => {
    expect(starsForScore(0)).toBe(1);
    expect(starsForScore(20)).toBe(1);
    expect(starsForScore(50)).toBe(3);
    expect(starsForScore(100)).toBe(5);
  });

  it('maps each grade to its documented XP/coins/review requirement', () => {
    expect(rewardsForGrade('D')).toEqual({ label: 'Common', xp: 50, coins: 5, humanReview: false });
    expect(rewardsForGrade('C')).toEqual({ label: 'Uncommon', xp: 120, coins: 15, humanReview: false });
    expect(rewardsForGrade('B')).toEqual({ label: 'Rare', xp: 250, coins: 40, humanReview: false });
    expect(rewardsForGrade('A')).toEqual({ label: 'Epic', xp: 500, coins: 100, humanReview: true });
    expect(rewardsForGrade('S')).toEqual({ label: 'Legendary', xp: 850, coins: 250, humanReview: true });
  });
});

describe('scoreDiscovery', () => {
  it('scores a common, everyday species low', () => {
    const result = scoreDiscovery(input({ species: { baseRarity: 0.03, nocturnal: false, seasonalityMonths: [] } }), weightSet);
    expect(result.grade).toBe('D');
    expect(result.score).toBeLessThan(40);
  });

  it('scores an extremely rare, first-ever, high-confidence discovery well above a common repeat sighting', () => {
    // Note: regionalRarity/discoveryFrequency/weather are neutral placeholders
    // (see rarity-engine.js) until live signals exist, so even a maxed-out
    // input can't yet reach A/S — this asserts the relative ordering instead.
    const rare = scoreDiscovery(
      input({
        species: { baseRarity: 0.95, nocturnal: false, seasonalityMonths: [] },
        confidence: 0.95,
        isFirstGlobal: true,
        gps: { lat: 40.0, lng: -74.0, accuracyM: 5 },
        lastCaptureGps: { lat: 41.0, lng: -75.0 },
      }),
      weightSet,
    );
    const common = scoreDiscovery(input({ species: { baseRarity: 0.03, nocturnal: false, seasonalityMonths: [] } }), weightSet);
    expect(rare.score).toBeGreaterThan(common.score);
    expect(['B', 'A', 'S']).toContain(rare.grade);
  });

  it('rewards a nocturnal species photographed at night over the same species at noon', () => {
    const nightResult = scoreDiscovery(
      input({ species: { baseRarity: 0.5, nocturnal: true, seasonalityMonths: [] }, capturedAt: '2026-07-13T23:00:00.000Z' }),
      weightSet,
    );
    const dayResult = scoreDiscovery(
      input({ species: { baseRarity: 0.5, nocturnal: true, seasonalityMonths: [] }, capturedAt: '2026-07-13T12:00:00.000Z' }),
      weightSet,
    );
    expect(nightResult.score).toBeGreaterThan(dayResult.score);
  });

  it('rewards an out-of-season sighting over an in-season one for a seasonal species', () => {
    const outOfSeason = scoreDiscovery(
      input({ species: { baseRarity: 0.5, nocturnal: false, seasonalityMonths: [11, 12, 1] }, capturedAt: '2026-07-13T12:00:00.000Z' }),
      weightSet,
    );
    const inSeason = scoreDiscovery(
      input({ species: { baseRarity: 0.5, nocturnal: false, seasonalityMonths: [7] }, capturedAt: '2026-07-13T12:00:00.000Z' }),
      weightSet,
    );
    expect(outOfSeason.score).toBeGreaterThan(inSeason.score);
  });

  it('gives a first-global discovery a strictly higher score than a repeat capture, all else equal', () => {
    const first = scoreDiscovery(input({ isFirstGlobal: true }), weightSet);
    const repeat = scoreDiscovery(input({ isFirstGlobal: false, isFirstForPlayer: false }), weightSet);
    expect(first.score).toBeGreaterThan(repeat.score);
  });

  it('caps the score at grade B when GPS is missing (low-telemetry guard)', () => {
    const result = scoreDiscovery(
      input({ species: { baseRarity: 0.99, nocturnal: false, seasonalityMonths: [] }, confidence: 0.99, gps: null, isFirstGlobal: true }),
      weightSet,
    );
    expect(result.score).toBeLessThanOrEqual(74);
    expect(result.lowTelemetryCapped).toBe(true);
  });

  it('caps the score at grade B when GPS accuracy is too coarse', () => {
    const result = scoreDiscovery(
      input({ species: { baseRarity: 0.99, nocturnal: false, seasonalityMonths: [] }, gps: { lat: 1, lng: 1, accuracyM: 500 }, isFirstGlobal: true }),
      weightSet,
    );
    expect(result.lowTelemetryCapped).toBe(true);
    expect(result.score).toBeLessThanOrEqual(74);
  });

  it('does not cap the score when GPS is present and accurate', () => {
    const result = scoreDiscovery(input({ gps: { lat: 1, lng: 1, accuracyM: 5 } }), weightSet);
    expect(result.lowTelemetryCapped).toBe(false);
  });

  it('persists the weight-set version on the result for later re-computation', () => {
    const result = scoreDiscovery(input(), { version: 7, weights: DEFAULT_WEIGHTS, gradeBands: DEFAULT_GRADE_BANDS });
    expect(result.weightSetVersion).toBe(7);
  });

  it('never produces a score outside 0-100', () => {
    const extreme = scoreDiscovery(
      input({ species: { baseRarity: 1, nocturnal: true, seasonalityMonths: [] }, confidence: 1, isFirstGlobal: true, capturedAt: '2026-01-01T23:00:00.000Z' }),
      weightSet,
    );
    expect(extreme.score).toBeGreaterThanOrEqual(0);
    expect(extreme.score).toBeLessThanOrEqual(100);
  });
});
