import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

/**
 * Derived balance-per-currency, rebuildable from CurrencyLedgerEntry — same
 * "materialized projection over an append-only log" pattern as XP.
 */
@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async balances(userId: string): Promise<Record<string, number>> {
    const rows = await this.prisma.currencyLedgerEntry.groupBy({
      by: ['currencyCode'],
      where: { userId },
      _sum: { amount: true },
    });
    return Object.fromEntries(rows.map((row) => [row.currencyCode, row._sum.amount ?? 0]));
  }
}
