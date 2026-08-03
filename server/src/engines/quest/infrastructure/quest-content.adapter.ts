import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ContentAdapter } from '../../../core/content-registry/content-adapter';
import { ContentRegistryService } from '../../../core/content-registry/content-registry.service';
import { QuestDefinitionData, RecentAssignmentRef } from '../domain/quest.types';
import { PrismaService } from '../../../core/prisma/prisma.service';

const questDefinitionSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  cadence: z.string(),
  rarity: z.string(),
  verificationType: z.string(),
  subjectTag: z.string(),
  xpReward: z.number().int(),
  cooldownDays: z.number().int(),
  targetValue: z.number().int(),
  unit: z.string(),
  instructions: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  coinReward: z.number().int().optional(),
  chainId: z.string().optional(),
});

type QuestDefinitionContent = z.infer<typeof questDefinitionSchema>;

/**
 * Quest Engine's typed view over the Content Registry. Quest definitions are
 * `ContentDefinition` rows with type 'quest_definition' — this is the only
 * place that knows how to parse their payload shape. QuestGenerator (pure
 * selection logic) is unaffected; it just receives QuestDefinitionData[]
 * from here instead of a bespoke quest_definitions table.
 */
@Injectable()
export class QuestContentAdapter extends ContentAdapter<QuestDefinitionContent> {
  protected readonly contentType = 'quest_definition';
  protected readonly schema = questDefinitionSchema;

  constructor(
    registry: ContentRegistryService,
    private readonly prisma: PrismaService,
  ) {
    super(registry);
  }

  async listDefinitions(filters: { cadence?: string; category?: string } = {}): Promise<QuestDefinitionData[]> {
    const all = await this.listActive();
    return all
      .filter((d) => d.enabled)
      .filter((d) => !filters.cadence || d.cadence === filters.cadence)
      .filter((d) => !filters.category || d.category === filters.category);
  }

  /** Assignment history for a user, most recent first, used for cooldown checks. */
  async recentAssignments(userId: string, cadence: string, since: Date): Promise<RecentAssignmentRef[]> {
    const assignments = await this.prisma.questAssignment.findMany({
      where: { userId, assignedAt: { gte: since } },
      orderBy: { assignedAt: 'desc' },
      select: { definitionId: true, assignedAt: true },
    });
    if (!assignments.length) return [];

    const definitionIds = [...new Set(assignments.map((a) => a.definitionId))];
    const definitions = await Promise.all(definitionIds.map((id) => this.getById(id)));
    const byId = new Map(definitions.filter(Boolean).map((d) => [d!.id, d!]));

    return assignments
      .filter((a) => byId.has(a.definitionId) && byId.get(a.definitionId)!.cadence === cadence)
      .map((a) => {
        const definition = byId.get(a.definitionId)!;
        return {
          definitionId: a.definitionId,
          subjectTag: definition.subjectTag,
          assignedAt: a.assignedAt,
          rarity: definition.rarity,
        };
      });
  }
}
