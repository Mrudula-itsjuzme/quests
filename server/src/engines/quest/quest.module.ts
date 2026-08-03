import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../identity/auth.module';
import { QueueName } from '../../core/job-queue/queue-names';
import { QuestContentAdapter } from './infrastructure/quest-content.adapter';
import { QuestAssignmentService } from './application/quest-assignment.service';
import { QuestLifecycleService } from './application/quest-lifecycle.service';
import { QuestSubmissionService } from './application/quest-submission.service';
import { QuestSchedulerService } from './application/quest-scheduler.service';
import { QuestVerificationListener } from './application/quest-verification-listener.service';
import { QuestGenerationProcessor } from './infrastructure/quest-generation.processor';
import { QuestGenerationSchedulerRegistrar } from './infrastructure/quest-generation-scheduler.registrar';
import { QuestController } from './interfaces/quest.controller';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: QueueName.QuestGeneration })],
  controllers: [QuestController],
  providers: [
    QuestContentAdapter,
    QuestAssignmentService,
    QuestLifecycleService,
    QuestSubmissionService,
    QuestSchedulerService,
    QuestVerificationListener,
    QuestGenerationProcessor,
    QuestGenerationSchedulerRegistrar,
  ],
  exports: [QuestAssignmentService, QuestLifecycleService, QuestSchedulerService],
})
export class QuestModule {}
