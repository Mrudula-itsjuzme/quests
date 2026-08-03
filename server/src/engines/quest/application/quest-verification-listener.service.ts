import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventType, SubmissionVerifiedPayload } from '../../../core/event-bus/game-events';
import { QuestLifecycleService } from './quest-lifecycle.service';
import { QuestContentAdapter } from '../infrastructure/quest-content.adapter';

const MAX_REJECTIONS_BEFORE_ABANDON = 3;

/**
 * Quest Engine's reaction to a verification decision. Verification Engine
 * never touches QuestAssignment rows directly — it only publishes
 * SubmissionVerified. This is the one place that decision turns into an
 * assignment-state transition, via the existing QuestLifecycleService state
 * machine (unchanged — only what triggers it moved).
 */
@Injectable()
export class QuestVerificationListener {
  private readonly logger = new Logger(QuestVerificationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: QuestLifecycleService,
    private readonly content: QuestContentAdapter,
  ) {}

  @OnEvent(GameEventType.SubmissionVerified)
  async onSubmissionVerified(payload: SubmissionVerifiedPayload) {
    const assignment = await this.prisma.questAssignment.findUnique({ where: { id: payload.assignmentId } });
    if (!assignment) {
      this.logger.warn(`SubmissionVerified for missing assignment ${payload.assignmentId}`);
      return;
    }

    if (payload.decision === 'approved') {
      const definition = await this.content.getById(assignment.definitionId);
      const isPhoto = definition?.verificationType === 'PHOTO';
      const nextProgress = isPhoto
        ? Math.min(assignment.targetValue, assignment.progressValue + 1)
        : assignment.targetValue;
      await this.lifecycle.recordProgress(assignment.id, nextProgress);
      return;
    }

    if (payload.decision === 'rejected') {
      const rejectionCount = await this.prisma.questSubmission.count({
        where: { assignmentId: assignment.id, status: 'rejected' },
      });
      if (rejectionCount >= MAX_REJECTIONS_BEFORE_ABANDON) {
        await this.lifecycle.abandon(assignment.id);
        return;
      }
    }

    await this.prisma.questAssignment.update({
      where: { id: assignment.id },
      data: { status: payload.decision === 'manual_review' ? 'pending_verification' : 'rejected' },
    });
  }
}
