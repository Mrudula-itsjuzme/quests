import { Injectable } from '@nestjs/common';
import { VerificationResult, VerificationStrategy, VerificationSubmissionInput } from '../verification-strategy';

/** Trusted self-report (water, journal, meditation). Still rate/cooldown-gated upstream by Quest Domain. */
@Injectable()
export class ManualConfirmationStrategy implements VerificationStrategy {
  readonly type = 'MANUAL';

  async verify(input: VerificationSubmissionInput): Promise<VerificationResult> {
    if (!input.text || input.text.trim().length === 0) {
      return { decision: 'rejected', metadata: { reason: 'empty_submission' } };
    }
    return { decision: 'approved', confidence: 1, metadata: { selfReported: true } };
  }
}
