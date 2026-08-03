import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiVisionProvider } from './ai-vision-provider';
import { StubVisionProvider } from './stub-vision.provider';
import { OpenAiVisionProvider } from './openai-vision.provider';

@Injectable()
export class AiVisionProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly stub: StubVisionProvider,
    private readonly openAi: OpenAiVisionProvider,
  ) {}

  resolve(): AiVisionProvider {
    const provider = this.config.get<string>('ai.provider');
    if (provider === 'openai') return this.openAi;
    // gemini provider slots in here the same way when added — additive, not a rewrite.
    return this.stub;
  }
}
