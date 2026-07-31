export const DomainEvents = Object.freeze({
  QuestAssigned: 'QuestAssigned',
  QuestCompleted: 'QuestCompleted',
  CampaignStarted: 'CampaignStarted',
  CampaignEnded: 'CampaignEnded',
  RewardGranted: 'RewardGranted',
  LevelUp: 'LevelUp',
  BadgeUnlocked: 'BadgeUnlocked',
  CommunityGoalCompleted: 'CommunityGoalCompleted',
});

export class DomainEventBus {
  constructor() {
    this.listeners = new Map();
    this.published = [];
  }

  on(type, listener) {
    const current = this.listeners.get(type) || [];
    current.push(listener);
    this.listeners.set(type, current);
    return () => this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item !== listener));
  }

  async publish(type, payload) {
    const event = { id: `${type}:${Date.now()}:${this.published.length}`, type, payload, occurredAt: new Date().toISOString() };
    this.published.push(event);
    for (const listener of this.listeners.get(type) || []) await listener(event);
    return event;
  }
}
