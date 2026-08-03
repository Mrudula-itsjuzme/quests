import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType, QuestCompletedPayload, StreakBrokenPayload, StreakExtendedPayload } from '../../../core/event-bus/game-events';

const DAY_MS = 86_400_000;

/**
 * Extends/resets a player's streak on daily-quest completion. Only the
 * first daily completion in a given period advances the streak — completing
 * all three daily quests the same day shouldn't extend it three times.
 * periodKey is `daily:YYYY-MM-DD`, produced by Quest Engine's period
 * calculation; parsing it here avoids re-deriving timezone-aware period
 * boundaries in Progression Engine.
 */
@Injectable()
export class StreakTrackingListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: GameEventBus,
  ) {}

  @OnEvent(GameEventType.QuestCompleted)
  async onQuestCompleted(payload: QuestCompletedPayload) {
    if (payload.cadence !== 'daily') return;
    const dateKey = payload.periodKey.replace(/^daily:/, '');

    const state = await this.prisma.streakState.upsert({
      where: { userId: payload.userId },
      create: { userId: payload.userId, currentStreak: 0, longestStreak: 0 },
      update: {},
    });

    if (state.lastCompletedPeriodKey === dateKey) return; // already counted today

    const isConsecutive = state.lastCompletedPeriodKey === previousDateKey(dateKey);
    const brokenStreak = !isConsecutive && state.lastCompletedPeriodKey !== null;
    const nextStreak = isConsecutive ? state.currentStreak + 1 : 1;

    const updated = await this.prisma.streakState.update({
      where: { userId: payload.userId },
      data: {
        currentStreak: nextStreak,
        longestStreak: Math.max(state.longestStreak, nextStreak),
        lastCompletedPeriodKey: dateKey,
      },
    });

    if (brokenStreak) {
      const broken: StreakBrokenPayload = { userId: payload.userId, previousStreak: state.currentStreak };
      this.eventBus.emit(GameEventType.StreakBroken, broken as unknown as Record<string, unknown>);
    }

    const extended: StreakExtendedPayload = { userId: payload.userId, currentStreak: updated.currentStreak, periodKey: dateKey };
    this.eventBus.emit(GameEventType.StreakExtended, extended as unknown as Record<string, unknown>);
  }
}

function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const previous = new Date(date.getTime() - DAY_MS);
  return previous.toISOString().slice(0, 10);
}
