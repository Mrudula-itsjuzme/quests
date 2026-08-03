import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ContentQuery {
  type: string;
  status?: string;
  activeAt?: Date;
}

/**
 * The unified, versioned content store. Quest definitions, achievement
 * rules, battle pass tiers, seasons, NPC scripts, store items are all rows
 * here, differentiated by `type` — the registry itself doesn't know what a
 * quest is. Each engine builds a typed ContentAdapter (see ./content-adapter.ts)
 * on top of this that validates `payload` against its own schema and returns
 * a strongly-typed domain object.
 */
@Injectable()
export class ContentRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ContentQuery) {
    const now = query.activeAt ?? new Date();
    return this.prisma.contentDefinition.findMany({
      where: {
        type: query.type,
        status: query.status ?? 'active',
        AND: [
          { OR: [{ activeFrom: null }, { activeFrom: { lte: now } }] },
          { OR: [{ activeUntil: null }, { activeUntil: { gte: now } }] },
        ],
      },
    });
  }

  async getById(id: string) {
    return this.prisma.contentDefinition.findUnique({ where: { id } });
  }

  async getByKey(type: string, key: string) {
    return this.prisma.contentDefinition.findUnique({ where: { type_key: { type, key } } });
  }

  async upsert(params: {
    type: string;
    key: string;
    payload: Record<string, unknown>;
    schemaVersion?: number;
    activeFrom?: Date | null;
    activeUntil?: Date | null;
    status?: string;
    createdBy?: string;
  }) {
    return this.prisma.contentDefinition.upsert({
      where: { type_key: { type: params.type, key: params.key } },
      create: {
        type: params.type,
        key: params.key,
        payload: params.payload as object,
        schemaVersion: params.schemaVersion ?? 1,
        activeFrom: params.activeFrom ?? null,
        activeUntil: params.activeUntil ?? null,
        status: params.status ?? 'active',
        createdBy: params.createdBy,
      },
      update: {
        payload: params.payload as object,
        schemaVersion: params.schemaVersion ?? 1,
        activeFrom: params.activeFrom,
        activeUntil: params.activeUntil,
        status: params.status,
      },
    });
  }
}
