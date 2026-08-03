import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { domainError } from '../../../core/errors/domain-error';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType } from '../../../core/event-bus/game-events';
import { QuestContentAdapter } from '../infrastructure/quest-content.adapter';
import { QuestGenerator } from '../domain/quest-generator';
import { dailyPeriod, monthlyPeriod, weeklyPeriod } from '../domain/period';
import { GeneratedAssignmentDraft } from '../domain/quest.types';

const DAILY_CATEGORIES = ['Mind', 'Body', 'Discovery'];

/**
 * Turns generator output into persisted assignments. Owns the idempotency
 * and transaction boundary — QuestGenerator itself never touches the DB.
 */
@Injectable()
export class QuestAssignmentService {
  private readonly generator = new QuestGenerator();

  constructor(
    private readonly prisma: PrismaService,
    private readonly content: QuestContentAdapter,
    private readonly eventBus: GameEventBus,
  ) {}

  async generateDaily(userId: string, timezone: string) {
    const now = new Date();
    const period = dailyPeriod(now, timezone);
    return this.generateForPeriod(userId, 'daily', period, async () => {
      const pool = await this.content.listDefinitions({ cadence: 'daily' });
      const recent = await this.content.recentAssignments(userId, 'daily', new Date(now.getTime() - 90 * 86_400_000));
      const selected = this.generator.selectDaily(pool, recent, DAILY_CATEGORIES, now);
      return selected.map((d) => this.generator.toDraft(d, period));
    });
  }

  async generateWeekly(userId: string, timezone: string) {
    const now = new Date();
    const period = weeklyPeriod(now, timezone);
    return this.generateForPeriod(userId, 'weekly', period, async () => {
      const pool = await this.content.listDefinitions({ cadence: 'weekly' });
      const recent = await this.content.recentAssignments(userId, 'weekly', new Date(0));
      const selected = this.generator.selectWeekly(pool, recent);
      return [this.generator.toDraft(selected, period)];
    });
  }

  async generateMonthly(userId: string, timezone: string) {
    const now = new Date();
    const period = monthlyPeriod(now, timezone);
    return this.generateForPeriod(userId, 'monthly', period, async () => {
      const pool = await this.content.listDefinitions({ cadence: 'monthly' });
      const recent = await this.content.recentAssignments(userId, 'monthly', new Date(now.getTime() - 365 * 86_400_000));
      const selected = this.generator.selectMonthly(pool, recent, now);
      return [this.generator.toDraft(selected, period)];
    });
  }

  private async generateForPeriod(
    userId: string,
    cadence: string,
    period: { key: string },
    select: () => Promise<GeneratedAssignmentDraft[]>,
  ) {
    const existing = await this.prisma.questAssignment.findFirst({
      where: { userId, periodKey: period.key },
    });
    if (existing) {
      return this.prisma.questAssignment.findMany({ where: { userId, periodKey: period.key } });
    }

    const drafts = await select();
    if (!drafts.length) throw domainError('quest_pool_exhausted', 409);

    const created = await this.prisma.$transaction(async (tx) => {
      // Re-check inside the transaction to close the race between the
      // existence check above and this insert under concurrent requests.
      const raced = await tx.questAssignment.findFirst({ where: { userId, periodKey: period.key } });
      if (raced) return tx.questAssignment.findMany({ where: { userId, periodKey: period.key } });

      const rows = [];
      for (const draft of drafts) {
        rows.push(
          await tx.questAssignment.create({
            data: {
              userId,
              definitionId: draft.definitionId,
              status: 'active',
              periodKey: draft.periodKey,
              progressValue: 0,
              targetValue: draft.targetValue,
              startsAt: draft.startsAt,
              expiresAt: draft.expiresAt,
            },
          }),
        );
      }
      return rows;
    });

    for (const assignment of created) {
      this.eventBus.emit(GameEventType.QuestAssigned, {
        userId,
        assignmentId: assignment.id,
        definitionId: assignment.definitionId,
        cadence,
        periodKey: assignment.periodKey,
      });
    }
    return created;
  }
}
