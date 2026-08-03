import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '../../../core/job-queue/queue-names';

/** Registers the repeatable season-reconciliation job at startup. Runs every 15 minutes — season boundaries don't need second-level precision. */
@Injectable()
export class LiveOpsSchedulerRegistrar implements OnModuleInit {
  constructor(@InjectQueue(QueueName.LiveOpsReconciliation) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'season-reconciliation-sweep',
      { pattern: '*/15 * * * *' },
      { name: 'reconcile' },
    );
  }
}
