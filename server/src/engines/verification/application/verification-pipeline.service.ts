import { Injectable } from '@nestjs/common';
import { domainError } from '../../../core/errors/domain-error';
import { PhotoVerificationStrategy } from '../domain/strategies/photo-verification.strategy';
import { ManualConfirmationStrategy } from '../domain/strategies/manual-confirmation.strategy';
import { VerificationResult, VerificationStrategy, VerificationSubmissionInput } from '../domain/verification-strategy';

/**
 * Dispatches a submission to the strategy matching its verification type.
 * Adding a new verification type (HEALTH, GPS) means registering a new
 * strategy here, not touching Quest Domain.
 */
@Injectable()
export class VerificationPipelineService {
  private readonly strategies: Map<string, VerificationStrategy>;

  constructor(photo: PhotoVerificationStrategy, manual: ManualConfirmationStrategy) {
    this.strategies = new Map<string, VerificationStrategy>([
      [photo.type, photo],
      [manual.type, manual],
    ]);
  }

  async verify(verificationType: string, input: VerificationSubmissionInput): Promise<VerificationResult> {
    const strategy = this.strategies.get(verificationType);
    if (!strategy) throw domainError('unsupported_verification_type', 409);
    return strategy.verify(input);
  }
}
