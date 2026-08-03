import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../core/redis/redis.module';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventType, XpGrantedPayload } from '../../../core/event-bus/game-events';

const GLOBAL_BOARD_KEY = 'leaderboard:global';

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
}

/**
 * Rankings are read from a Redis sorted set, never computed with a live SQL
 * aggregation on request — this is what "don't calculate rankings on every
 * request" actually means at scale. Postgres's xp_ledger_entries remains the
 * source of truth; Redis is a cache kept live by incremental ZINCRBY on
 * every XpGranted event, with `rebuildFromLedger` as the drift-correction
 * job run on a schedule.
 */
@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(GameEventType.XpGranted)
  async onXpGranted(payload: XpGrantedPayload) {
    await this.redis.zincrby(GLOBAL_BOARD_KEY, payload.amount, payload.userId);
  }

  async top(limit = 50): Promise<LeaderboardEntry[]> {
    const raw = await this.redis.zrevrange(GLOBAL_BOARD_KEY, 0, limit - 1, 'WITHSCORES');
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({ userId: raw[i], score: Number(raw[i + 1]), rank: i / 2 + 1 });
    }
    return entries;
  }

  async rankOf(userId: string): Promise<{ rank: number; score: number } | null> {
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(GLOBAL_BOARD_KEY, userId),
      this.redis.zscore(GLOBAL_BOARD_KEY, userId),
    ]);
    if (rank === null || score === null) return null;
    return { rank: rank + 1, score: Number(score) };
  }

  /** Full recompute from the ledger — drift correction against the incremental Redis updates, run nightly. */
  async rebuildFromLedger(): Promise<number> {
    const totals = await this.prisma.xpLedgerEntry.groupBy({
      by: ['userId'],
      _sum: { amount: true },
    });
    if (!totals.length) return 0;

    const pipeline = this.redis.pipeline();
    pipeline.del(GLOBAL_BOARD_KEY);
    for (const row of totals) {
      pipeline.zadd(GLOBAL_BOARD_KEY, row._sum.amount ?? 0, row.userId);
    }
    await pipeline.exec();
    return totals.length;
  }
}
