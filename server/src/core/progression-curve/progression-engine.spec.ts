import { ProgressionEngine, ProgressionCurveStep } from './progression-engine';

const CURVE: ProgressionCurveStep[] = [
  { level: 1, xpCost: 100, tier: 'Bronze' },
  { level: 3, xpCost: 200, tier: 'Silver' },
];

describe('ProgressionEngine', () => {
  it('starts at level 1 with 0 xp', () => {
    const engine = new ProgressionEngine(CURVE);
    const snapshot = engine.snapshot(0);
    expect(snapshot.level).toBe(1);
    expect(snapshot.tier).toBe('Bronze');
    expect(snapshot.xpIntoLevel).toBe(0);
    expect(snapshot.xpForCurrentLevel).toBe(100);
  });

  it('levels up exactly at the xp boundary', () => {
    const engine = new ProgressionEngine(CURVE);
    expect(engine.snapshot(99).level).toBe(1);
    expect(engine.snapshot(100).level).toBe(2);
  });

  it('applies the next band cost once the level threshold is crossed', () => {
    const engine = new ProgressionEngine(CURVE);
    // level 1 costs 100, level 2 costs 100 (still under band 1) -> level 3 starts the 200-cost band
    const snapshot = engine.snapshot(199);
    expect(snapshot.level).toBe(2);
    expect(snapshot.xpToNextLevel).toBe(1);
  });

  it('promotes tier at the configured level boundary', () => {
    const engine = new ProgressionEngine(CURVE);
    expect(engine.snapshot(199).tier).toBe('Bronze'); // level 2
    expect(engine.snapshot(200).tier).toBe('Silver'); // level 3
  });

  it('is monotonic: more xp never produces a lower level', () => {
    const engine = new ProgressionEngine(CURVE);
    let previousLevel = 0;
    for (let xp = 0; xp <= 5000; xp += 37) {
      const level = engine.levelFromXp(xp);
      expect(level).toBeGreaterThanOrEqual(previousLevel);
      previousLevel = level;
    }
  });

  it('treats negative or NaN xp as zero', () => {
    const engine = new ProgressionEngine(CURVE);
    expect(engine.snapshot(-50).level).toBe(1);
    expect(engine.snapshot(Number.NaN).level).toBe(1);
  });

  it('falls back to the default curve when none is provided', () => {
    const engine = new ProgressionEngine();
    const snapshot = engine.snapshot(0);
    expect(snapshot.level).toBe(1);
    expect(snapshot.tier).toBe('Bronze');
  });

  it('repeats the highest band cost beyond the configured curve', () => {
    const engine = new ProgressionEngine(CURVE);
    // once past level 3, every subsequent level costs 200
    const snap = engine.snapshot(100 + 200 * 10 + 150);
    expect(snap.xpForCurrentLevel).toBe(200);
  });
});
