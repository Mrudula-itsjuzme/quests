export class ProgressionEngine {
  snapshot(totalXp = 0) {
    let remaining = Math.max(0, Number(totalXp) || 0);
    let level = 1;
    while (remaining >= this.xpForLevel(level)) {
      remaining -= this.xpForLevel(level);
      level += 1;
    }
    const xpForCurrentLevel = this.xpForLevel(level);
    return {
      level,
      tier: this.tierForLevel(level),
      xpIntoLevel: remaining,
      xpForCurrentLevel,
      xpToNextLevel: xpForCurrentLevel - remaining,
      progressToNextLevel: remaining / xpForCurrentLevel,
    };
  }

  levelFromXp(totalXp = 0) {
    return this.snapshot(totalXp).level;
  }

  rankTitleForXp(totalXp = 0) {
    if (totalXp >= 100_000) return 'Legend Circle';
    if (totalXp >= 50_000) return 'Mythril Knight';
    if (totalXp >= 20_000) return 'Pathfinder';
    if (totalXp >= 10_000) return 'Guardian';
    if (totalXp >= 5_000) return 'Scout';
    return 'Adventurer';
  }

  xpForLevel(level) {
    if (level <= 20) return 250;
    if (level <= 40) return 500;
    if (level <= 60) return 750;
    if (level <= 80) return 1000;
    if (level <= 100) return 1500;
    return 2000;
  }

  tierForLevel(level) {
    if (level <= 20) return 'Bronze';
    if (level <= 40) return 'Silver';
    if (level <= 60) return 'Gold';
    if (level <= 80) return 'Platinum';
    if (level <= 100) return 'Mythril';
    if (level <= 120) return 'Diamond';
    return 'Ascendant';
  }
}

export const progressionEngine = new ProgressionEngine();
export function calculateProgression(totalXp = 0) {
  return progressionEngine.snapshot(totalXp);
}
