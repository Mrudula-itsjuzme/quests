import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AuthContext } from '../../identity/auth-context';
import { XpLedgerService } from './xp-ledger.service';

@Injectable()
export class PlayerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpLedger: XpLedgerService,
  ) {}

  async ensure(identity: AuthContext) {
    await this.prisma.user.upsert({
      where: { id: identity.userId },
      update: { timezone: identity.timezone, email: identity.email },
      create: { id: identity.userId, timezone: identity.timezone, email: identity.email },
    });
    return this.prisma.playerProfile.upsert({
      where: { userId: identity.userId },
      update: {},
      create: { userId: identity.userId, displayName: identity.email?.split('@')[0] ?? 'Adventurer' },
    });
  }

  async getMe(identity: AuthContext) {
    const profile = await this.ensure(identity);
    const progression = await this.xpLedger.snapshotFor(identity.userId);
    return { ...profile, ...progression };
  }

  async updateMe(
    identity: AuthContext,
    patch: Partial<{
      displayName: string;
      avatarUrl: string;
      primaryPath: string;
      reminderTime: string;
      motionPreference: string;
      onboardingCompleted: boolean;
    }>,
  ) {
    const current = await this.ensure(identity);
    const { onboardingCompleted, ...rest } = patch;
    const data: Record<string, unknown> = { ...rest };
    if (onboardingCompleted === true && !current.onboardingCompletedAt) {
      data.onboardingCompletedAt = new Date();
    }
    const updated = await this.prisma.playerProfile.update({ where: { userId: identity.userId }, data });
    const progression = await this.xpLedger.snapshotFor(identity.userId);
    return { ...updated, ...progression };
  }
}
