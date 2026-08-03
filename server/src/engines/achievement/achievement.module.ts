import { Module } from '@nestjs/common';
import { AchievementContentAdapter } from './infrastructure/achievement-content.adapter';
import { AchievementEventListener } from './application/achievement-event-listener.service';

@Module({
  providers: [AchievementContentAdapter, AchievementEventListener],
  exports: [AchievementContentAdapter],
})
export class AchievementModule {}
