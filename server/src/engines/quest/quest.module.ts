import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { QuestContentAdapter } from './infrastructure/quest-content.adapter';
import { QuestAssignmentService } from './application/quest-assignment.service';
import { QuestLifecycleService } from './application/quest-lifecycle.service';
import { QuestSubmissionService } from './application/quest-submission.service';
import { QuestSchedulerService } from './application/quest-scheduler.service';
import { QuestVerificationListener } from './application/quest-verification-listener.service';
import { QuestController } from './interfaces/quest.controller';

@Module({
  imports: [AuthModule],
  controllers: [QuestController],
  providers: [
    QuestContentAdapter,
    QuestAssignmentService,
    QuestLifecycleService,
    QuestSubmissionService,
    QuestSchedulerService,
    QuestVerificationListener,
  ],
  exports: [QuestAssignmentService, QuestLifecycleService, QuestSchedulerService],
})
export class QuestModule {}
