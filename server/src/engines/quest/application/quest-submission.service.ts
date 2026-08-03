import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType } from '../../../core/event-bus/game-events';
import { QuestLifecycleService } from './quest-lifecycle.service';

/**
 * Entry point for a player submitting proof of a quest. Publishes
 * QuestSubmissionReceived and returns — it never calls Verification Engine
 * directly. The state-machine reaction to a verification decision lives in
 * QuestVerificationListener, which subscribes to SubmissionVerified.
 */
@Injectable()
export class QuestSubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: QuestLifecycleService,
    private readonly eventBus: GameEventBus,
  ) {}

  async submit(
    userId: string,
    assignmentId: string,
    payload: { text?: string; uploadId?: string; feedOptIn?: boolean },
  ) {
    const assignment = await this.lifecycle.requireActive(userId, assignmentId);

    const submission = await this.prisma.questSubmission.create({
      data: {
        assignmentId,
        userId,
        verificationType: assignment.definition.verificationType,
        status: 'pending',
        uploadId: payload.uploadId,
        metadata: { text: payload.text, feedOptIn: payload.feedOptIn !== false },
      },
    });

    this.eventBus.emit(GameEventType.QuestSubmissionReceived, {
      userId,
      assignmentId,
      submissionId: submission.id,
      verificationType: assignment.definition.verificationType,
      subjectTag: assignment.definition.subjectTag,
      text: payload.text,
      uploadId: payload.uploadId,
    });

    return { submission, assignment, completed: false as const, status: 'pending_verification' as const };
  }
}
