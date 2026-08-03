import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType, LevelUpPayload, QuestCompletedPayload, StreakExtendedPayload } from '../../../core/event-bus/game-events';
import { ProgressionEngine } from '../../../core/progression-curve/progression-engine';
import { ProgressionCurveRepository } from '../../../core/progression-curve/progression-curve.repository';
import { AchievementContentAdapter } from '../infrastructure/achievement-content.adapter';
import { AchievementRuleEvaluator, PlayerStatsSnapshot } from '../domain/achievement-rule-evaluator';

/**
 * Achievement Engine's reaction to any progress-shaped event. Re-evaluates
 * every enabled achievement's unlock rule uniformly rather than special-
 * casing per achievement — adding a new achievement is a Content Registry
 * write, not a new listener.
 */
@Injectable()
export class AchievementEventListener {
  private readonly evaluator = new AchievementRuleEvaluator();

  constructor(
    private readonly prisma: PrismaService,
    private readonly content: AchievementContentAdapter,
    private readonly eventBus: GameEventBus,
    private readonly curveRepo: ProgressionCurveRepository,
  ) {}

  @OnEvent(GameEventType.QuestCompleted)
  async onQuestCompleted(payload: QuestCompletedPayload) {
    await this.evaluateFor(payload.userId);
  }

  @OnEvent(GameEventType.LevelUp)
  async onLevelUp(payload: LevelUpPayload) {
    await this.evaluateFor(payload.userId);
  }

  @OnEvent(GameEventType.StreakExtended)
  async onStreakExtended(payload: StreakExtendedPayload) {
    await this.evaluateFor(payload.userId);
  }

  private async evaluateFor(userId: string) {
    const [definitions, stats, alreadyUnlocked] = await Promise.all([
      this.content.listEnabled(),
      this.snapshotStats(userId),
      this.prisma.achievementUnlock.findMany({ where: { userId }, select: { achievementId: true } }),
    ]);
    const unlockedIds = new Set(alreadyUnlocked.map((u) => u.achievementId));

    for (const definition of definitions) {
      if (unlockedIds.has(definition.id)) continue;
      if (!this.evaluator.evaluate(definition.unlockRule, stats)) continue;

      await this.prisma.achievementUnlock.create({
        data: { userId, achievementId: definition.id },
      });
      this.eventBus.emit(GameEventType.AchievementUnlocked, { userId, achievementId: definition.id });
    }
  }

  private async snapshotStats(userId: string): Promise<PlayerStatsSnapshot> {
    const [streak, completions, xpTotal, curve] = await Promise.all([
      this.prisma.streakState.findUnique({ where: { userId } }),
      this.prisma.questAssignment.count({ where: { userId, status: 'completed' } }),
      this.prisma.xpLedgerEntry.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.curveRepo.load(),
    ]);
    // Level is derived from total XP using the same shared curve Progression
    // Engine writes XP against (core/progression-curve) — reading a pure,
    // stateless formula isn't cross-engine coupling the way calling another
    // engine's application service would be.
    const totalXp = xpTotal._sum.amount ?? 0;
    const level = new ProgressionEngine(curve).levelFromXp(totalXp);
    return {
      currentStreak: streak?.currentStreak ?? 0,
      totalQuestCompletions: completions,
      level,
    };
  }
}
