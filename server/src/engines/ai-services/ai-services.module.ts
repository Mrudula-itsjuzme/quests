import { Module } from '@nestjs/common';
import { StubVisionProvider } from './infrastructure/providers/stub-vision.provider';
import { OpenAiVisionProvider } from './infrastructure/providers/openai-vision.provider';
import { AiVisionProviderFactory } from './infrastructure/providers/ai-vision-provider.factory';
import { AiVisionService } from './application/ai-vision.service';

@Module({
  providers: [StubVisionProvider, OpenAiVisionProvider, AiVisionProviderFactory, AiVisionService],
  exports: [AiVisionService],
})
export class AiServicesModule {}
