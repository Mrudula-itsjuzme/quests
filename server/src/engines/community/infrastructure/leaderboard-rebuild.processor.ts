import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '../../../core/job-queue/queue-names';
import { LeaderboardService } from '../application/leaderboard.service';

/** Nightly full recompute from xp_ledger_entries — drift correction against the incremental Redis ZINCRBY updates. */
@Processor(QueueName.LeaderboardRebuild)
export class LeaderboardRebuildProcessor extends WorkerHost {
  private readonly logger = new Logger(LeaderboardRebuildProcessor.name);

  constructor(private readonly leaderboard: LeaderboardService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    const count = await this.leaderboard.rebuildFromLedger();
    this.logger.log(`rebuilt leaderboard for ${count} players (job ${job.name})`);
    return { rebuiltCount: count };
  }
}
