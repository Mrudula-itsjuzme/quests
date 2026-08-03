import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './core/prisma/prisma.module';
import { EventBusModule } from './core/event-bus/event-bus.module';
import { ContentRegistryModule } from './core/content-registry/content-registry.module';
import { ClockModule } from './core/clock/clock.module';
import { ProgressionCurveModule } from './core/progression-curve/progression-curve.module';
import { JobQueueModule } from './core/job-queue/job-queue.module';
import { RedisModule } from './core/redis/redis.module';
import { HealthController } from './health.controller';
import { AuthModule } from './engines/identity/auth.module';
import { AiServicesModule } from './engines/ai-services/ai-services.module';
import { QuestModule } from './engines/quest/quest.module';
import { ProgressionModule } from './engines/progression/progression.module';
import { VerificationModule } from './engines/verification/verification.module';
import { EconomyModule } from './engines/economy/economy.module';
import { AchievementModule } from './engines/achievement/achievement.module';
import { LiveOpsModule } from './engines/liveops/liveops.module';
import { CommunityModule } from './engines/community/community.module';
import { AnalyticsModule } from './engines/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    EventBusModule,
    ContentRegistryModule,
    ClockModule,
    ProgressionCurveModule,
    JobQueueModule,
    RedisModule,
    AuthModule,
    AiServicesModule,
    VerificationModule,
    QuestModule,
    ProgressionModule,
    EconomyModule,
    AchievementModule,
    LiveOpsModule,
    CommunityModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
