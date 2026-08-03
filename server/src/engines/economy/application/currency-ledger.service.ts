import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType } from '../../../core/event-bus/game-events';
import { domainError } from '../../../core/errors/domain-error';
import { withIdempotency } from '../../../core/idempotency/idempotency-guard';

/**
 * Same append-only pattern as XpLedgerService — never a mutable balance
 * column. currencyCode discriminates gold/gems/event tokens/battle-pass XP;
 * adding a new currency is a new code, not new infrastructure.
 */
@Injectable()
export class CurrencyLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: GameEventBus,
  ) {}

  async balance(userId: string, currencyCode: string): Promise<number> {
    const result = await this.prisma.currencyLedgerEntry.aggregate({
      where: { userId, currencyCode },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async grant(userId: string, currencyCode: string, amount: number, source: string, idempotencyKey: string, sourceRefId?: string) {
    const { wasNew, result } = await withIdempotency(
      { findByKey: (key) => this.prisma.currencyLedgerEntry.findUnique({ where: { idempotencyKey: key } }) },
      idempotencyKey,
      () =>
        this.prisma.currencyLedgerEntry.create({
          data: { userId, currencyCode, amount, source, sourceRefId, idempotencyKey },
        }),
    );
    if (wasNew) {
      this.eventBus.emit(GameEventType.CurrencyGranted, { userId, currencyCode, amount, source, sourceRefId });
    }
    return { balance: await this.balance(userId, currencyCode), entry: result };
  }

  /** Throws insufficient_funds rather than leaking a raw Prisma/DB error. */
  async spend(userId: string, currencyCode: string, amount: number, reason: string, idempotencyKey: string) {
    if (amount <= 0) throw domainError('invalid_spend_amount', 400);

    const { wasNew, result } = await withIdempotency(
      { findByKey: (key) => this.prisma.currencyLedgerEntry.findUnique({ where: { idempotencyKey: key } }) },
      idempotencyKey,
      async () => {
        const current = await this.balance(userId, currencyCode);
        if (current < amount) throw domainError('insufficient_funds', 409);
        return this.prisma.currencyLedgerEntry.create({
          data: { userId, currencyCode, amount: -amount, source: reason, idempotencyKey },
        });
      },
    );
    if (wasNew) {
      this.eventBus.emit(GameEventType.CurrencySpent, { userId, currencyCode, amount, reason });
    }
    return { balance: await this.balance(userId, currencyCode), entry: result };
  }
}
