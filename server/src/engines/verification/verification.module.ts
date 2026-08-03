import { Module } from '@nestjs/common';
import { AiServicesModule } from '../ai-services/ai-services.module';
import { PhotoVerificationStrategy } from './domain/strategies/photo-verification.strategy';
import { ManualConfirmationStrategy } from './domain/strategies/manual-confirmation.strategy';
import { VerificationPipelineService } from './application/verification-pipeline.service';
import { VerificationEventListener } from './application/verification-event-listener.service';

@Module({
  imports: [AiServicesModule],
  providers: [PhotoVerificationStrategy, ManualConfirmationStrategy, VerificationPipelineService, VerificationEventListener],
  exports: [VerificationPipelineService],
})
export class VerificationModule {}
