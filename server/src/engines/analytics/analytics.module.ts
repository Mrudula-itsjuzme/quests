import { Module } from '@nestjs/common';
import { ContentDifficultyListener } from './application/content-difficulty-listener.service';

/** Read-only consumer of the event stream — never mutates gameplay state, only records stats and publishes derived signals. */
@Module({
  providers: [ContentDifficultyListener],
})
export class AnalyticsModule {}
