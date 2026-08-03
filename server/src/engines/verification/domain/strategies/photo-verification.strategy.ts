import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { AiVisionProviderFactory } from '../../infrastructure/providers/ai-vision-provider.factory';
import { VerificationResult, VerificationStrategy, VerificationSubmissionInput } from '../verification-strategy';

/**
 * Upload -> dedup pre-check -> AI classification -> confidence-threshold decision.
 * Dedup runs before the (costly) AI call so replay abuse is rejected cheaply.
 */
@Injectable()
export class PhotoVerificationStrategy implements VerificationStrategy {
  readonly type = 'PHOTO';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly visionFactory: AiVisionProviderFactory,
  ) {}

  async verify(input: VerificationSubmissionInput): Promise<VerificationResult> {
    if (!input.uploadId) {
      return { decision: 'rejected', metadata: { reason: 'missing_upload' } };
    }

    // uploadId stands in for the stored object's content address; a real
    // deployment computes a perceptual hash (pHash) off the decoded image so
    // near-duplicate reuploads collide too, not just byte-identical files.
    const imageHash = createHash('sha256').update(input.uploadId).digest('hex');

    const duplicate = await this.prisma.questSubmission.findFirst({
      where: { userId: input.userId, imageHash, id: { not: undefined } },
    });
    if (duplicate) {
      return { decision: 'rejected', imageHash, metadata: { reason: 'duplicate_image' } };
    }

    const provider = this.visionFactory.resolve();
    const classification = await provider.classify(input.uploadId, input.subjectTag);

    const approveThreshold = this.config.get<number>('ai.approveThreshold') ?? 0.85;
    const manualReviewThreshold = this.config.get<number>('ai.manualReviewThreshold') ?? 0.5;

    const decision =
      classification.matches && classification.confidence >= approveThreshold
        ? 'approved'
        : classification.confidence >= manualReviewThreshold
          ? 'manual_review'
          : 'rejected';

    return {
      decision,
      confidence: classification.confidence,
      imageHash,
      metadata: { labels: classification.labels ?? [] },
    };
  }
}
