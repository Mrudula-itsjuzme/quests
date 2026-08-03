import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '../../../core/job-queue/queue-names';
import { QuestSchedulerService } from '../application/quest-scheduler.service';

/**
 * Runs the daily/weekly/monthly reset as a BullMQ repeatable job instead of
 * an in-process cron loop — survives a restart mid-run, retries on failure,
 * and can be scaled to a dedicated worker process independent of the API.
 */
@Processor(QueueName.QuestGeneration)
export class QuestGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestGenerationProcessor.name);

  constructor(private readonly scheduler: QuestSchedulerService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`running quest generation job ${job.name}`);
    return this.scheduler.runDailyResetForAllUsers();
  }
}
