import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GameEventType, QuestCompletedPayload } from '../../../core/event-bus/game-events';
import { XpLedgerService } from './xp-ledger.service';

/**
 * Progression Engine's reaction to gameplay events. Quest Engine never calls
 * this directly — it only publishes QuestCompleted. This is what keeps XP
 * granting in exactly one place instead of duplicated per call site.
 */
@Injectable()
export class ProgressionEventListener {
  constructor(private readonly xpLedger: XpLedgerService) {}

  @OnEvent(GameEventType.QuestCompleted)
  async onQuestCompleted(payload: QuestCompletedPayload) {
    await this.xpLedger.grant(
      payload.userId,
      payload.xpReward,
      'quest_completion',
      payload.assignmentId,
      `quest_completion:${payload.assignmentId}`,
    );
  }
}
