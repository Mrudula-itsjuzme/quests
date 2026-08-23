/**
 * Explorer Tier ladder — blueprint §17.3. Six tiers, each with sub-levels
 * I–V. No "Master"/"Mythril"/"Ascendant" — those were a pre-blueprint tier
 * name set and are a direct conflict with §31 decision #1, which explicitly
 * rejects a 7th tier. Diamond precedes Adamantium (not the other way around).
 * Levels 121+ stay in Adamantium sub-level V rather than growing more sublevels
 * (the blueprint doesn't specify prestige stars past V — §17.3 leaves that
 * open — so this holds at V rather than inventing a rule the blueprint didn't
 * give).
 */
const TIER_LADDER = Object.freeze([
  { name: 'Bronze', minLevel: 1, maxLevel: 20 },
  { name: 'Silver', minLevel: 21, maxLevel: 40 },
  { name: 'Gold', minLevel: 41, maxLevel: 60 },
  { name: 'Platinum', minLevel: 61, maxLevel: 80 },
  { name: 'Diamond', minLevel: 81, maxLevel: 100 },
  { name: 'Adamantium', minLevel: 101, maxLevel: Infinity },
]);

export class ProgressionEngine {
  snapshot(totalXp = 0) {
    let remaining = Math.max(0, Number(totalXp) || 0);
    let level = 1;
    while (remaining >= this.xpForLevel(level)) {
      remaining -= this.xpForLevel(level);
      level += 1;
    }
    const xpForCurrentLevel = this.xpForLevel(level);
    const { tier, subLevel } = this.tierForLevel(level);
    return {
      level,
      tier,
      subLevel,
      tierLabel: `${tier} Explorer ${subLevel}`,
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

  /** Returns { tier, subLevel } for a level — blueprint §17.3: six tiers, sub-levels I–V. */
  tierForLevel(level) {
    const band = TIER_LADDER.find((b) => level >= b.minLevel && level <= b.maxLevel) || TIER_LADDER[TIER_LADDER.length - 1];
    const span = band.maxLevel === Infinity ? 20 : band.maxLevel - band.minLevel + 1;
    const levelIntoTier = level - band.minLevel;
    const subLevelIndex = Math.min(4, Math.floor((levelIntoTier / span) * 5));
    const subLevel = ['I', 'II', 'III', 'IV', 'V'][subLevelIndex];
    return { tier: band.name, subLevel };
  }
}

export const progressionEngine = new ProgressionEngine();
export function calculateProgression(totalXp = 0) {
  return progressionEngine.snapshot(totalXp);
}
