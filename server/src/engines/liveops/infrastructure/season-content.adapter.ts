import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ContentAdapter } from '../../../core/content-registry/content-adapter';

const seasonSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  battlePassTierIds: z.array(z.string()).default([]),
});

export type SeasonContent = z.infer<typeof seasonSchema>;

/** LiveOps Engine's typed view over Season content rows. */
@Injectable()
export class SeasonContentAdapter extends ContentAdapter<SeasonContent> {
  protected readonly contentType = 'season';
  protected readonly schema = seasonSchema;
}
