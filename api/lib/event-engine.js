import { randomUUID } from 'node:crypto';

export class EventEngine {
  constructor(repository, notificationProvider) {
    this.repository = repository;
    this.notifications = notificationProvider;
  }

  async openChest(userId, chestId, regionId, idempotencyKey) {
    const loot = this._rollChestLoot(chestId);
    const result = await this.repository.openChest(userId, chestId, regionId, idempotencyKey, loot);
    if (!result._replayed && result.event?.justActivated) {
      await this._triggerRegionalEvent(regionId, result.event.eventId);
    }
    const { _replayed, ...response } = result;
    return response;
  }

  async getRegionalEventStatus(regionId) {
    return this.repository.getRegionalEventStatus(regionId);
  }

  _rollChestLoot(chestId) {
    // Stubbed random loot table
    const coins = Math.floor(Math.random() * 50) + 10;
    return { coins, items: [] };
  }

  async _triggerRegionalEvent(regionId, eventId) {
    if (this.notifications) {
      await this.notifications.send({
        topic: `region_${regionId}`,
        notification: {
          title: 'A Secret Event has Begun!',
          body: 'Explorers have opened enough chests to trigger a regional event!',
          kind: 'regional_event'
        }
      });
    }
  }
}
