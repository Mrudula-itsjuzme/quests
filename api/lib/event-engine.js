import { randomUUID } from 'node:crypto';

export class EventEngine {
  constructor(repository, notificationProvider) {
    this.repository = repository;
    this.notifications = notificationProvider;
  }

  async openChest(userId, chestId, regionId) {
    // 1. Remove the chest from inventory
    const consumed = await this.repository.consumeInventoryItem(userId, chestId);
    if (!consumed) {
      throw new Error('Chest not found in inventory');
    }

    // 2. Roll loot
    const loot = this._rollChestLoot(chestId);
    
    // 3. Grant rewards
    await this.repository.grantRewards(userId, loot);

    let eventStatus = null;
    // 4. If it's an event chest, increment regional counter
    if (chestId.startsWith('event_chest_') && regionId) {
      eventStatus = await this.repository.contributeToRegionalEvent(userId, chestId, regionId);
      
      // If threshold was just reached, trigger the event
      if (eventStatus.justActivated) {
        await this._triggerRegionalEvent(regionId, eventStatus.eventId);
      }
    }

    return { loot, event: eventStatus };
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
