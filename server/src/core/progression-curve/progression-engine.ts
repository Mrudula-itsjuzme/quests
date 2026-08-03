export interface ProgressionCurveStep {
  level: number;
  xpCost: number;
  tier: string;
}

export interface ProgressionSnapshot {
  level: number;
  tier: string;
  xpIntoLevel: number;
  xpForCurrentLevel: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
}

const FALLBACK_CURVE: ProgressionCurveStep[] = [
  { level: 1, xpCost: 250, tier: 'Bronze' },
];

/**
 * Pure function of (totalXp, curve) -> snapshot. One implementation, used by
 * every domain that needs level/tier/rank — API responses, notifications,
 * leaderboard display, achievement rule evaluation. The curve is data
 * (ProgressionCurveStep[] loaded from the DB), never hardcoded, so game
 * design can rebalance without a deploy.
 */
export class ProgressionEngine {
  constructor(private readonly curve: ProgressionCurveStep[] = FALLBACK_CURVE) {}

  /** Curve rows are band starts (level 1, 21, 41, ...) — cost applies to every level until the next band start. */
  private xpCostForLevel(level: number): number {
    const sorted = [...this.curve].sort((a, b) => a.level - b.level);
    let applicable = sorted[0] ?? FALLBACK_CURVE[0];
    for (const step of sorted) {
      if (level >= step.level) applicable = step;
    }
    return applicable.xpCost;
  }

  private tierForLevel(level: number): string {
    const sorted = [...this.curve].sort((a, b) => a.level - b.level);
    let tier = sorted[0]?.tier ?? 'Bronze';
    for (const step of sorted) {
      if (level >= step.level) tier = step.tier;
    }
    return tier;
  }

  snapshot(totalXp: number): ProgressionSnapshot {
    let remaining = Math.max(0, Math.floor(totalXp) || 0);
    let level = 1;
    while (remaining >= this.xpCostForLevel(level)) {
      remaining -= this.xpCostForLevel(level);
      level += 1;
    }
    const xpForCurrentLevel = this.xpCostForLevel(level);
    return {
      level,
      tier: this.tierForLevel(level),
      xpIntoLevel: remaining,
      xpForCurrentLevel,
      xpToNextLevel: xpForCurrentLevel - remaining,
      progressToNextLevel: xpForCurrentLevel === 0 ? 0 : remaining / xpForCurrentLevel,
    };
  }

  levelFromXp(totalXp: number): number {
    return this.snapshot(totalXp).level;
  }
}
