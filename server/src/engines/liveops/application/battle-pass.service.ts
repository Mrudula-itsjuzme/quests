import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

/**
 * Minimal scaffold: read-only for now. Full battle-pass logic (tokens
 * earned via its own Economy currency track, tier claiming, reward grants)
 * is a later increment — this gives it a home so that work is additive
 * rather than a retrofit onto Progression/Economy.
 */
@Injectable()
export class BattlePassService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string, seasonContentId: string) {
    return this.prisma.battlePassProgress.findUnique({
      where: { userId_seasonContentId: { userId, seasonContentId } },
    });
  }
}
