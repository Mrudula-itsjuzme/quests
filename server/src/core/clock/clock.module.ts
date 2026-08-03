import { Global, Module } from '@nestjs/common';
import { GameClock } from './game-clock.service';

@Global()
@Module({
  providers: [GameClock],
  exports: [GameClock],
})
export class ClockModule {}
