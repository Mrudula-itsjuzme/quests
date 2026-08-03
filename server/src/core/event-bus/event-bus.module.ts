import { Global, Module } from '@nestjs/common';
import { GameEventBus } from './game-event-bus.service';

@Global()
@Module({
  providers: [GameEventBus],
  exports: [GameEventBus],
})
export class EventBusModule {}
