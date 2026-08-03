import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType, QuestSubmissionReceivedPayload, SubmissionVerifiedPayload } from '../../../core/event-bus/game-events';
import { VerificationPipelineService } from './verification-pipeline.service';

/**
 * Verification Engine's reaction to a submitted quest. Quest Engine never
 * calls this directly — it only publishes QuestSubmissionReceived. This
 * listener runs the strategy pipeline, records the result on the submission
 * row (Verification Engine owns QuestSubmission's status/confidence/hash
 * fields), and publishes SubmissionVerified for Quest Engine to react to.
 */
@Injectable()
export class VerificationEventListener {
  private readonly logger = new Logger(VerificationEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: VerificationPipelineService,
    private readonly eventBus: GameEventBus,
  ) {}

  @OnEvent(GameEventType.QuestSubmissionReceived)
  async onQuestSubmissionReceived(payload: QuestSubmissionReceivedPayload) {
    try {
      const result = await this.pipeline.verify(payload.verificationType, {
        assignmentId: payload.assignmentId,
        userId: payload.userId,
        subjectTag: payload.subjectTag,
        text: payload.text,
        uploadId: payload.uploadId,
      });

      await this.prisma.questSubmission.update({
        where: { id: payload.submissionId },
        data: {
          status: result.decision,
          imageHash: result.imageHash,
          confidence: result.confidence,
          metadata: (result.metadata ?? {}) as object,
        },
      });

      const verified: SubmissionVerifiedPayload = {
        userId: payload.userId,
        assignmentId: payload.assignmentId,
        submissionId: payload.submissionId,
        decision: result.decision,
        confidence: result.confidence,
        imageHash: result.imageHash,
      };
      this.eventBus.emit(GameEventType.SubmissionVerified, verified as unknown as Record<string, unknown>);
    } catch (error) {
      this.logger.error(`verification failed for submission ${payload.submissionId}`, error as Error);
      await this.prisma.questSubmission.update({
        where: { id: payload.submissionId },
        data: { status: 'rejected', metadata: { reason: 'verification_error' } },
      });
      this.eventBus.emit(GameEventType.SubmissionVerified, {
        userId: payload.userId,
        assignmentId: payload.assignmentId,
        submissionId: payload.submissionId,
        decision: 'rejected',
      } as unknown as Record<string, unknown>);
    }
  }
}
