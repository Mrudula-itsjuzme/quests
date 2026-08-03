import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '../../core/job-queue/queue-names';
import { SeasonContentAdapter } from './infrastructure/season-content.adapter';
import { SeasonService } from './application/season.service';
import { WorldEventService } from './application/world-event.service';
import { BattlePassService } from './application/battle-pass.service';
import { LiveOpsReconciliationProcessor } from './infrastructure/liveops-reconciliation.processor';
import { LiveOpsSchedulerRegistrar } from './infrastructure/liveops-scheduler.registrar';

@Module({
  imports: [BullModule.registerQueue({ name: QueueName.LiveOpsReconciliation })],
  providers: [
    SeasonContentAdapter,
    SeasonService,
    WorldEventService,
    BattlePassService,
    LiveOpsReconciliationProcessor,
    LiveOpsSchedulerRegistrar,
  ],
  exports: [SeasonService, WorldEventService, BattlePassService],
})
export class LiveOpsModule {}
