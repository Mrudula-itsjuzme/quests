import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionCurveStep } from './progression-engine';

const DEFAULT_CURVE: ProgressionCurveStep[] = [
  { level: 1, xpCost: 250, tier: 'Bronze' },
  { level: 21, xpCost: 500, tier: 'Silver' },
  { level: 41, xpCost: 750, tier: 'Gold' },
  { level: 61, xpCost: 1000, tier: 'Platinum' },
  { level: 81, xpCost: 1500, tier: 'Mythril' },
  { level: 101, xpCost: 2000, tier: 'Diamond' },
  { level: 121, xpCost: 2500, tier: 'Ascendant' },
];

@Injectable()
export class ProgressionCurveRepository {
  private cache: ProgressionCurveStep[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Cached in-process for the life of the instance — curve changes are rare and admin-driven; a restart picks up edits. */
  async load(): Promise<ProgressionCurveStep[]> {
    if (this.cache) return this.cache;
    const rows = await this.prisma.progressionCurveStep.findMany({ orderBy: { level: 'asc' } });
    this.cache = rows.length ? rows : DEFAULT_CURVE;
    return this.cache;
  }

  invalidate(): void {
    this.cache = null;
  }
}
