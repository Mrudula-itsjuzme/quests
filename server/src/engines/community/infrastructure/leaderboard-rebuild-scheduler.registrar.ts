import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '../../../core/job-queue/queue-names';

/** Registers the nightly leaderboard-rebuild job at startup. */
@Injectable()
export class LeaderboardRebuildSchedulerRegistrar implements OnModuleInit {
  constructor(@InjectQueue(QueueName.LeaderboardRebuild) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'nightly-leaderboard-rebuild',
      { pattern: '0 3 * * *' },
      { name: 'rebuild' },
    );
  }
}
