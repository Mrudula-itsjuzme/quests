export interface AchievementRule {
  type: string;
  value: number;
}

export interface PlayerStatsSnapshot {
  currentStreak: number;
  totalQuestCompletions: number;
  level: number;
}

/**
 * Interprets the unlock-rule DSL generically instead of one handler per
 * achievement. Adding a new rule type is a new case here, not a new
 * achievement-specific service — the definitions themselves stay pure
 * content (Content Registry rows), never code.
 */
export class AchievementRuleEvaluator {
  evaluate(rule: AchievementRule, stats: PlayerStatsSnapshot): boolean {
    switch (rule.type) {
      case 'streak_days':
        return stats.currentStreak >= rule.value;
      case 'quest_completions':
        return stats.totalQuestCompletions >= rule.value;
      case 'level_reached':
        return stats.level >= rule.value;
      default:
        return false;
    }
  }
}
