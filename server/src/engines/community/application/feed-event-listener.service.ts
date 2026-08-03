import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { GameEventType, QuestCompletedPayload } from '../../../core/event-bus/game-events';
import { ContentRegistryService } from '../../../core/content-registry/content-registry.service';

/**
 * Community Engine's reaction to QuestCompleted. Only posts to the feed if
 * the originating submission opted in (checked via the QuestSubmission row,
 * not a field on QuestCompletedPayload — keeps the core event payload free
 * of feed-specific concerns). Feed entries snapshot display data at post
 * time so an old post survives a later profile rename without a join.
 */
@Injectable()
export class FeedEventListener {
  private readonly logger = new Logger(FeedEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly content: ContentRegistryService,
    private readonly eventBus: GameEventBus,
  ) {}

  @OnEvent(GameEventType.QuestCompleted)
  async onQuestCompleted(payload: QuestCompletedPayload) {
    const submission = await this.prisma.questSubmission.findFirst({
      where: { assignmentId: payload.assignmentId, userId: payload.userId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    const feedOptIn = (submission?.metadata as { feedOptIn?: boolean } | null)?.feedOptIn;
    if (feedOptIn === false) return;

    const [profile, definition] = await Promise.all([
      this.prisma.playerProfile.findUnique({ where: { userId: payload.userId } }),
      this.content.getById(payload.definitionId),
    ]);
    if (!profile || !definition) {
      this.logger.warn(`skipping feed post for ${payload.assignmentId}: missing profile or definition`);
      return;
    }

    const post = await this.prisma.feedPost.create({
      data: {
        userId: payload.userId,
        displayNameSnapshot: profile.displayName,
        avatarUrlSnapshot: profile.avatarUrl,
        assignmentId: payload.assignmentId,
        questTitleSnapshot: (definition.payload as { title?: string }).title ?? 'Quest',
        xpEarned: payload.xpReward,
        imageRef: submission?.uploadId ?? null,
      },
    });

    this.eventBus.emit(GameEventType.FeedPostCreated, {
      userId: payload.userId,
      assignmentId: payload.assignmentId,
      feedPostId: post.id,
    });
  }
}
