import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * BullMQ/Redis wiring, shared by every engine that needs a repeatable or
 * one-off background job (quest generation, season reconciliation, async AI
 * verification, notification fanout). Queues themselves are registered per
 * engine via BullModule.registerQueue in that engine's own module — this
 * just configures the shared Redis connection once.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redisUrl') },
      }),
    }),
  ],
  exports: [BullModule],
})
export class JobQueueModule {}
