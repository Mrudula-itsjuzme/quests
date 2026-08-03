import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

/**
 * Minimal scaffold: read-only for now. Full world-event logic (aggregating
 * QuestCompleted/XpGranted into a community-wide counter, broadcasting
 * progress over WebSocket) is a later increment — this gives it a home in
 * the engine structure so that work doesn't require inventing a new module.
 */
@Injectable()
export class WorldEventService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(eventContentId: string) {
    return this.prisma.worldEventProgress.findUnique({ where: { eventContentId } });
  }

  async listActive() {
    return this.prisma.worldEventProgress.findMany();
  }
}
