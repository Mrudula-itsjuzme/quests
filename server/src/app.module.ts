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
import { HealthController } from './health.controller';
import { AuthModule } from './engines/identity/auth.module';
import { QuestModule } from './engines/quest/quest.module';
import { ProgressionModule } from './engines/progression/progression.module';
import { VerificationModule } from './engines/verification/verification.module';
import { EconomyModule } from './engines/economy/economy.module';
import { AchievementModule } from './engines/achievement/achievement.module';
import { LiveOpsModule } from './engines/liveops/liveops.module';

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
    AuthModule,
    VerificationModule,
    QuestModule,
    ProgressionModule,
    EconomyModule,
    AchievementModule,
    LiveOpsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
