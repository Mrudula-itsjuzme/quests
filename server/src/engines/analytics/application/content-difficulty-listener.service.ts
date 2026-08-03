import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType, SubmissionVerifiedPayload } from '../../../core/event-bus/game-events';

const SIGNAL_SAMPLE_THRESHOLD = 20;

/**
 * Analytics Engine is a read-only consumer of the event stream — it never
 * mutates gameplay state. This listener tallies per-quest approval/
 * rejection counts and, once a definition has enough samples, publishes
 * ContentDifficultySignal so LiveOps/AI Services can deprioritize a quest
 * with a persistently high rejection rate. Quest Engine never needs to know
 * this happened.
 */
@Injectable()
export class ContentDifficultyListener {
  private readonly logger = new Logger(ContentDifficultyListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: GameEventBus,
  ) {}

  @OnEvent(GameEventType.SubmissionVerified)
  async onSubmissionVerified(payload: SubmissionVerifiedPayload) {
    const assignment = await this.prisma.questAssignment.findUnique({
      where: { id: payload.assignmentId },
      select: { definitionId: true },
    });
    if (!assignment) {
      this.logger.warn(`SubmissionVerified for missing assignment ${payload.assignmentId}`);
      return;
    }

    const field =
      payload.decision === 'approved' ? 'approvedCount' : payload.decision === 'rejected' ? 'rejectedCount' : 'manualReviewCount';

    const stats = await this.prisma.contentDifficultyStats.upsert({
      where: { definitionId: assignment.definitionId },
      create: { definitionId: assignment.definitionId, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });

    const sampleSize = stats.approvedCount + stats.rejectedCount + stats.manualReviewCount;
    if (sampleSize < SIGNAL_SAMPLE_THRESHOLD) return;

    const approvalRate = stats.approvedCount / sampleSize;
    this.eventBus.emit(GameEventType.ContentDifficultySignal, {
      definitionId: assignment.definitionId,
      approvalRate,
      sampleSize,
    });
  }
}
