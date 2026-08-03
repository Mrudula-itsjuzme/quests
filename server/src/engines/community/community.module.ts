import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../identity/auth.module';
import { QueueName } from '../../core/job-queue/queue-names';
import { FeedEventListener } from './application/feed-event-listener.service';
import { LeaderboardService } from './application/leaderboard.service';
import { LeaderboardController } from './interfaces/leaderboard.controller';
import { LeaderboardRebuildProcessor } from './infrastructure/leaderboard-rebuild.processor';
import { LeaderboardRebuildSchedulerRegistrar } from './infrastructure/leaderboard-rebuild-scheduler.registrar';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: QueueName.LeaderboardRebuild })],
  controllers: [LeaderboardController],
  providers: [
    FeedEventListener,
    LeaderboardService,
    LeaderboardRebuildProcessor,
    LeaderboardRebuildSchedulerRegistrar,
  ],
  exports: [LeaderboardService],
})
export class CommunityModule {}
