import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ContentAdapter } from '../../../core/content-registry/content-adapter';

const achievementRuleSchema = z.object({
  type: z.string(), // "streak_days" | "quest_completions" | "level_reached" | ...
  value: z.number(),
});

const achievementDefinitionSchema = z.object({
  kind: z.string(), // badge | title | milestone | cosmetic
  title: z.string(),
  description: z.string(),
  unlockRule: achievementRuleSchema,
  rewardConfig: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().default(true),
});

export type AchievementDefinitionContent = z.infer<typeof achievementDefinitionSchema>;

/** Achievement Engine's typed view over the Content Registry, same pattern as QuestContentAdapter. */
@Injectable()
export class AchievementContentAdapter extends ContentAdapter<AchievementDefinitionContent> {
  protected readonly contentType = 'achievement_definition';
  protected readonly schema = achievementDefinitionSchema;

  async listEnabled(): Promise<Array<AchievementDefinitionContent & { id: string }>> {
    const all = await this.listActive();
    return all.filter((a) => a.enabled);
  }
}
