import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '../../../core/job-queue/queue-names';

/**
 * Registers the repeatable "run daily reset for all users" job once at
 * startup. Runs hourly and lets QuestSchedulerService's per-user timezone
 * period calculation decide whether that user's daily/weekly/monthly
 * boundary has actually been crossed — the job firing hourly is cheap
 * idempotency insurance, not a precision requirement.
 */
@Injectable()
export class QuestGenerationSchedulerRegistrar implements OnModuleInit {
  constructor(@InjectQueue(QueueName.QuestGeneration) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'hourly-reset-sweep',
      { pattern: '0 * * * *' },
      { name: 'reset-sweep' },
    );
  }
}
