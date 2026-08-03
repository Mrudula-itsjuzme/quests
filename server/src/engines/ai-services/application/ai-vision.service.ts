import { Injectable } from '@nestjs/common';
import { AiVisionProviderFactory } from '../infrastructure/providers/ai-vision-provider.factory';
import { AiVisionClassification } from '../infrastructure/providers/ai-vision-provider';

/**
 * AI Services Engine's public surface: one provider-abstraction layer,
 * many callers. Verification Engine uses this for photo-quest
 * classification; later callers (AI-generated quest drafts, NPC dialogue)
 * use the same engine rather than each growing their own provider wiring.
 */
@Injectable()
export class AiVisionService {
  constructor(private readonly factory: AiVisionProviderFactory) {}

  async classify(imageRef: string, subjectTag: string): Promise<AiVisionClassification> {
    const provider = this.factory.resolve();
    return provider.classify(imageRef, subjectTag);
  }
}
