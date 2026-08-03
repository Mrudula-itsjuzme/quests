import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '../../../core/job-queue/queue-names';
import { SeasonService } from '../application/season.service';

/**
 * Runs SeasonService.reconcile() on a schedule — this is what turns a
 * Content Registry write (a season's activeFrom/activeUntil) into
 * SeasonStarted/SeasonEnded events without a deploy.
 */
@Processor(QueueName.LiveOpsReconciliation)
export class LiveOpsReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(LiveOpsReconciliationProcessor.name);

  constructor(private readonly seasons: SeasonService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`running liveops reconciliation job ${job.name}`);
    await this.seasons.reconcile();
    return { ok: true };
  }
}
