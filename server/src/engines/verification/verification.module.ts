import { Module } from '@nestjs/common';
import { PhotoVerificationStrategy } from './domain/strategies/photo-verification.strategy';
import { ManualConfirmationStrategy } from './domain/strategies/manual-confirmation.strategy';
import { VerificationPipelineService } from './application/verification-pipeline.service';
import { VerificationEventListener } from './application/verification-event-listener.service';
import { AiVisionProviderFactory } from './infrastructure/providers/ai-vision-provider.factory';
import { StubVisionProvider } from './infrastructure/providers/stub-vision.provider';
import { OpenAiVisionProvider } from './infrastructure/providers/openai-vision.provider';

@Module({
  providers: [
    StubVisionProvider,
    OpenAiVisionProvider,
    AiVisionProviderFactory,
    PhotoVerificationStrategy,
    ManualConfirmationStrategy,
    VerificationPipelineService,
    VerificationEventListener,
  ],
  exports: [VerificationPipelineService],
})
export class VerificationModule {}
