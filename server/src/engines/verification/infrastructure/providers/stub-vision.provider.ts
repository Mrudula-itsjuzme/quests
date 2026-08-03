import { Injectable } from '@nestjs/common';
import { AiVisionClassification, AiVisionProvider } from './ai-vision-provider';

/**
 * Deterministic placeholder used when no real vision provider is configured
 * (local dev / CI). Never used in production — AiVisionProviderFactory picks
 * OpenAI/Gemini when their API keys are present.
 */
@Injectable()
export class StubVisionProvider implements AiVisionProvider {
  async classify(_imageRef: string, _subjectTag: string): Promise<AiVisionClassification> {
    return { matches: true, confidence: 0.9, labels: ['stub'] };
  }
}
