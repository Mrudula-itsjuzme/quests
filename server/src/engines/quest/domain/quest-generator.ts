import { domainError } from '../../../core/errors/domain-error';
import {
  GeneratedAssignmentDraft,
  QuestDefinitionData,
  QuestPeriod,
  RecentAssignmentRef,
} from './quest.types';

export const RARITY_WEIGHTS: Record<string, number> = {
  Common: 50,
  Uncommon: 28,
  Rare: 14,
  Epic: 6,
  Legendary: 2,
};

const DAY_MS = 86_400_000;

/**
 * Pure quest selection logic. No DB, no I/O — given a definition pool and a
 * user's recent assignment history, produces the candidate set for a period.
 * Deterministic given the injected `random` function, which is what makes
 * cooldown/rarity invariants testable without a database.
 */
export class QuestGenerator {
  constructor(private readonly random: () => number = Math.random) {}

  /** One quest per category (Mind/Body/Discovery), respecting per-subject cooldowns. */
  selectDaily(
    pool: QuestDefinitionData[],
    recent: RecentAssignmentRef[],
    categories: string[],
    now: Date,
  ): QuestDefinitionData[] {
    return categories.map((category) => {
      const categoryPool = pool.filter((d) => d.category === category && d.enabled);
      const useWeights = category === 'Discovery';
      return this.selectWithCooldown(categoryPool, recent, now, useWeights ? RARITY_WEIGHTS : null);
    });
  }

  /** Single higher-difficulty quest, excluding anything assigned in the lookback window. */
  selectWeekly(
    pool: QuestDefinitionData[],
    recent: RecentAssignmentRef[],
    lookbackAssignments = 6,
  ): QuestDefinitionData {
    const excludeIds = new Set(recent.slice(0, lookbackAssignments).map((r) => r.definitionId));
    const eligible = pool.filter((d) => d.enabled && !excludeIds.has(d.id));
    return this.weightedPick(eligible.length ? eligible : pool.filter((d) => d.enabled), RARITY_WEIGHTS);
  }

  /** Single monthly expedition, excluding anything assigned in the last year. */
  selectMonthly(
    pool: QuestDefinitionData[],
    recent: RecentAssignmentRef[],
    now: Date,
    lookbackDays = 365,
  ): QuestDefinitionData {
    const cutoff = now.getTime() - lookbackDays * DAY_MS;
    const excludeIds = new Set(recent.filter((r) => r.assignedAt.getTime() >= cutoff).map((r) => r.definitionId));
    const enabled = pool.filter((d) => d.enabled);
    const eligible = enabled.filter((d) => !excludeIds.has(d.id));
    return this.weightedPick(eligible.length ? eligible : enabled, RARITY_WEIGHTS);
  }

  toDraft(definition: QuestDefinitionData, period: QuestPeriod): GeneratedAssignmentDraft {
    return {
      definitionId: definition.id,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      rarity: definition.rarity,
      cadence: definition.cadence,
      verificationType: definition.verificationType,
      subjectTag: definition.subjectTag,
      targetValue: definition.targetValue,
      unit: definition.unit,
      xpReward: definition.xpReward,
      periodKey: period.key,
      startsAt: period.startsAt,
      expiresAt: period.expiresAt,
    };
  }

  /**
   * Excludes definitions whose subjectTag was assigned within its own
   * cooldown window. If that empties the pool, relax to the full pool minus
   * Legendary (Legendary subjects always keep their long cooldown — no
   * "the pool ran dry so give them a Legendary" fallback).
   */
  private selectWithCooldown(
    pool: QuestDefinitionData[],
    recent: RecentAssignmentRef[],
    now: Date,
    weights: Record<string, number> | null,
  ): QuestDefinitionData {
    const withinCooldown = (definition: QuestDefinitionData) =>
      recent.some(
        (r) =>
          r.subjectTag === definition.subjectTag &&
          now.getTime() - r.assignedAt.getTime() < definition.cooldownDays * DAY_MS,
      );
    const eligible = pool.filter((d) => !withinCooldown(d));
    const relaxed = eligible.length ? eligible : pool.filter((d) => d.rarity !== 'Legendary');
    if (!relaxed.length) throw domainError('quest_pool_exhausted', 409);
    return weights ? this.weightedPick(relaxed, weights) : relaxed[Math.floor(this.random() * relaxed.length)];
  }

  private weightedPick(items: QuestDefinitionData[], weights: Record<string, number>): QuestDefinitionData {
    if (!items.length) throw domainError('quest_pool_exhausted', 409);
    const total = items.reduce((sum, item) => sum + (weights[item.rarity] ?? 0), 0);
    if (!total) return items[Math.floor(this.random() * items.length)];
    let cursor = this.random() * total;
    for (const item of items) {
      cursor -= weights[item.rarity] ?? 0;
      if (cursor < 0) return item;
    }
    return items[items.length - 1];
  }
}
