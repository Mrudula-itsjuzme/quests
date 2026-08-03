import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType } from '../../../core/event-bus/game-events';
import { GameClock } from '../../../core/clock/game-clock.service';
import { SeasonContentAdapter } from '../infrastructure/season-content.adapter';

/**
 * Reads active `season` content and reconciles SeasonState against it. A new
 * season going live is a Content Registry write (activeFrom/activeUntil on a
 * ContentDefinition row) — this service is what turns that content change
 * into a SeasonStarted/SeasonEnded event other engines can react to, without
 * a deploy.
 */
@Injectable()
export class SeasonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly content: SeasonContentAdapter,
    private readonly eventBus: GameEventBus,
    private readonly clock: GameClock,
  ) {}

  async getActiveSeason() {
    const now = this.clock.now();
    const [season] = await this.content.listActive(now);
    return season ?? null;
  }

  /** Call on a schedule (BullMQ) to reconcile SeasonState with active content. */
  async reconcile() {
    const now = this.clock.now();
    const active = await this.content.listActive(now);
    const activeIds = new Set(active.map((s) => s.id));

    const states = await this.prisma.seasonState.findMany();
    for (const state of states) {
      const shouldBeActive = activeIds.has(state.seasonContentId);
      if (shouldBeActive && state.status !== 'active') {
        await this.prisma.seasonState.update({
          where: { id: state.id },
          data: { status: 'active', startedAt: now },
        });
        this.eventBus.emit(GameEventType.SeasonStarted, { seasonContentId: state.seasonContentId });
      } else if (!shouldBeActive && state.status === 'active') {
        await this.prisma.seasonState.update({
          where: { id: state.id },
          data: { status: 'ended', endedAt: now },
        });
        this.eventBus.emit(GameEventType.SeasonEnded, { seasonContentId: state.seasonContentId });
      }
    }

    for (const season of active) {
      const exists = states.some((s) => s.seasonContentId === season.id);
      if (!exists) {
        await this.prisma.seasonState.create({
          data: { seasonContentId: season.id, status: 'active', startedAt: now },
        });
        this.eventBus.emit(GameEventType.SeasonStarted, { seasonContentId: season.id });
      }
    }
  }
}
