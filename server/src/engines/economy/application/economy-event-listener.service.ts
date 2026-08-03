import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GameEventType, QuestCompletedPayload } from '../../../core/event-bus/game-events';
import { CurrencyLedgerService } from './currency-ledger.service';

const DEFAULT_CURRENCY = 'gold';

/**
 * Economy Engine's reaction to gameplay events. Quest Engine never calls
 * this directly — it only publishes QuestCompleted. Most quests won't carry
 * a coinReward yet; this is additive infrastructure other content (store
 * items, battle pass) will build on.
 */
@Injectable()
export class EconomyEventListener {
  constructor(private readonly currencyLedger: CurrencyLedgerService) {}

  @OnEvent(GameEventType.QuestCompleted)
  async onQuestCompleted(payload: QuestCompletedPayload) {
    if (!payload.coinReward) return;
    await this.currencyLedger.grant(
      payload.userId,
      DEFAULT_CURRENCY,
      payload.coinReward,
      'quest_completion',
      `quest_completion_coin:${payload.assignmentId}`,
      payload.assignmentId,
    );
  }
}
