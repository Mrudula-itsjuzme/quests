import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GameEventBus } from '../../../core/event-bus/game-event-bus.service';
import { domainError } from '../../../core/errors/domain-error';
import { GameEventType, QuestCompletedPayload } from '../../../core/event-bus/game-events';
import { AssignmentStatus } from '../domain/quest.types';
import { QuestContentAdapter } from '../infrastructure/quest-content.adapter';

const ACTIVE_STATES: AssignmentStatus[] = ['active', 'assigned', 'rejected'];

/**
 * The only place a QuestAssignment's status transitions. Never awards XP
 * directly — emits QuestCompleted and lets the Progression Domain react.
 * This is the seam that keeps XP math in exactly one place.
 */
@Injectable()
export class QuestLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: GameEventBus,
    private readonly content: QuestContentAdapter,
  ) {}

  async requireActive(userId: string, assignmentId: string) {
    const assignment = await this.prisma.questAssignment.findFirst({
      where: { id: assignmentId, userId },
    });
    if (!assignment) throw domainError('quest_not_found', 404);
    if (assignment.expiresAt <= new Date()) {
      await this.expire(assignment.id);
      throw domainError('quest_expired', 409);
    }
    if (!ACTIVE_STATES.includes(assignment.status as AssignmentStatus)) {
      throw domainError('invalid_quest_state', 409);
    }
    const definition = await this.content.getById(assignment.definitionId);
    if (!definition) throw domainError('quest_definition_not_found', 404);
    return { ...assignment, definition };
  }

  async recordProgress(assignmentId: string, progressValue: number) {
    const assignment = await this.prisma.questAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
    });
    const clamped = Math.min(assignment.targetValue, Math.max(assignment.progressValue, progressValue));
    if (clamped >= assignment.targetValue) {
      return this.complete(assignmentId);
    }
    const updated = await this.prisma.questAssignment.update({
      where: { id: assignmentId },
      data: { progressValue: clamped, status: 'active' },
    });
    return { assignment: updated, completed: false as const };
  }

  async complete(assignmentId: string) {
    const now = new Date();
    const current = await this.prisma.questAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    const definition = current.status === 'completed' ? null : await this.content.getById(current.definitionId);

    const { assignment, event } = await this.prisma.$transaction(async (tx) => {
      if (current.status === 'completed' || !definition) {
        return { assignment: current, event: null as QuestCompletedPayload | null };
      }
      const updated = await tx.questAssignment.update({
        where: { id: assignmentId },
        data: { status: 'completed', progressValue: current.targetValue, completedAt: now },
      });
      const payload: QuestCompletedPayload = {
        userId: current.userId,
        assignmentId: current.id,
        definitionId: current.definitionId,
        cadence: definition.cadence,
        category: definition.category,
        rarity: definition.rarity,
        xpReward: definition.xpReward,
        periodKey: current.periodKey,
        completedAt: now.toISOString(),
      };
      await this.eventBus.record(tx, GameEventType.QuestCompleted, payload as unknown as Record<string, unknown>);
      return { assignment: updated, event: payload };
    });

    if (event) this.eventBus.emit(GameEventType.QuestCompleted, event as unknown as Record<string, unknown>);
    return { assignment, completed: true as const };
  }

  async expire(assignmentId: string) {
    const assignment = await this.prisma.questAssignment.update({
      where: { id: assignmentId },
      data: { status: 'expired' },
    });
    this.eventBus.emit(GameEventType.QuestExpired, {
      userId: assignment.userId,
      assignmentId: assignment.id,
      definitionId: assignment.definitionId,
    });
    return assignment;
  }

  async abandon(assignmentId: string) {
    const assignment = await this.prisma.questAssignment.update({
      where: { id: assignmentId },
      data: { status: 'abandoned' },
    });
    this.eventBus.emit(GameEventType.QuestAbandoned, {
      userId: assignment.userId,
      assignmentId: assignment.id,
      definitionId: assignment.definitionId,
    });
    return assignment;
  }

  async expireOverdue(userId: string) {
    const overdue = await this.prisma.questAssignment.findMany({
      where: { userId, status: { in: ACTIVE_STATES }, expiresAt: { lte: new Date() } },
    });
    for (const assignment of overdue) {
      await this.expire(assignment.id);
    }
  }
}
