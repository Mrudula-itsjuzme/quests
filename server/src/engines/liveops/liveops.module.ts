import { Module } from '@nestjs/common';
import { SeasonContentAdapter } from './infrastructure/season-content.adapter';
import { SeasonService } from './application/season.service';
import { WorldEventService } from './application/world-event.service';
import { BattlePassService } from './application/battle-pass.service';

@Module({
  providers: [SeasonContentAdapter, SeasonService, WorldEventService, BattlePassService],
  exports: [SeasonService, WorldEventService, BattlePassService],
})
export class LiveOpsModule {}
