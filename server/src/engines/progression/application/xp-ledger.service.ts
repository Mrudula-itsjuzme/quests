import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType, LevelUpPayload, TierPromotedPayload } from '../../../core/event-bus/game-events';
import { withIdempotency } from '../../../core/idempotency/idempotency-guard';
import { ProgressionEngine } from '../../../core/progression-curve/progression-engine';
import { ProgressionCurveRepository } from '../../../core/progression-curve/progression-curve.repository';

/**
 * Single source of truth for XP. Grants are append-only ledger rows keyed by
 * idempotency (event id) — replaying the same QuestCompleted event twice
 * never double-grants XP. total_xp is always derived by summing the ledger,
 * never mutated directly.
 */
@Injectable()
export class XpLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: GameEventBus,
    private readonly curveRepo: ProgressionCurveRepository,
  ) {}

  async totalXp(userId: string): Promise<number> {
    const result = await this.prisma.xpLedgerEntry.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async grant(userId: string, amount: number, source: string, sourceRefId: string, idempotencyKey: string) {
    const { wasNew } = await withIdempotency(
      { findByKey: (key) => this.prisma.xpLedgerEntry.findUnique({ where: { idempotencyKey: key } }) },
      idempotencyKey,
      () => this.prisma.xpLedgerEntry.create({ data: { userId, amount, source, sourceRefId, idempotencyKey } }),
    );
    if (!wasNew) return this.snapshotFor(userId);

    const before = (await this.totalXp(userId)) - amount;
    const after = before + amount;

    const curve = await this.curveRepo.load();
    const engine = new ProgressionEngine(curve);
    const beforeSnapshot = engine.snapshot(before);
    const afterSnapshot = engine.snapshot(after);

    if (afterSnapshot.level > beforeSnapshot.level) {
      const payload: LevelUpPayload = {
        userId,
        previousLevel: beforeSnapshot.level,
        newLevel: afterSnapshot.level,
        totalXp: after,
      };
      this.eventBus.emit(GameEventType.LevelUp, payload as unknown as Record<string, unknown>);
    }
    if (afterSnapshot.tier !== beforeSnapshot.tier) {
      const payload: TierPromotedPayload = {
        userId,
        previousTier: beforeSnapshot.tier,
        newTier: afterSnapshot.tier,
      };
      this.eventBus.emit(GameEventType.TierPromoted, payload as unknown as Record<string, unknown>);
    }

    return { totalXp: after, ...afterSnapshot, levelUp: afterSnapshot.level > beforeSnapshot.level };
  }

  async snapshotFor(userId: string) {
    const totalXp = await this.totalXp(userId);
    const curve = await this.curveRepo.load();
    const engine = new ProgressionEngine(curve);
    return { totalXp, ...engine.snapshot(totalXp), levelUp: false as const };
  }
}
