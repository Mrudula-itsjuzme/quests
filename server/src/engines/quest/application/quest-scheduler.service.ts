import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { QuestAssignmentService } from './quest-assignment.service';
import { QuestLifecycleService } from './quest-lifecycle.service';

/**
 * Triggers quest generation. Contains no business logic of its own — it
 * enumerates users and delegates to QuestAssignmentService. Invoked by a
 * BullMQ repeatable job (see workers/quest-generation.processor.ts) rather
 * than owning its own cron loop.
 */
@Injectable()
export class QuestSchedulerService {
  private readonly logger = new Logger(QuestSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: QuestAssignmentService,
    private readonly lifecycle: QuestLifecycleService,
  ) {}

  async runDailyResetForAllUsers() {
    const users = await this.prisma.user.findMany({ select: { id: true, timezone: true } });
    let processed = 0;
    for (const user of users) {
      try {
        await this.lifecycle.expireOverdue(user.id);
        await this.assignments.generateDaily(user.id, user.timezone);
        await this.assignments.generateWeekly(user.id, user.timezone);
        await this.assignments.generateMonthly(user.id, user.timezone);
        processed += 1;
      } catch (error) {
        this.logger.error(`daily reset failed for user ${user.id}`, error as Error);
      }
    }
    return { processedUsers: processed, totalUsers: users.length };
  }
}
