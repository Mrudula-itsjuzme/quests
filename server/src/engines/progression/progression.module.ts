import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { XpLedgerService } from './application/xp-ledger.service';
import { ProgressionEventListener } from './application/progression-event-listener.service';
import { StreakTrackingListener } from './application/streak-tracking-listener.service';
import { PlayerProfileService } from './application/player-profile.service';
import { ProfileController } from './interfaces/profile.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [XpLedgerService, ProgressionEventListener, StreakTrackingListener, PlayerProfileService],
  exports: [XpLedgerService, PlayerProfileService],
})
export class ProgressionModule {}
