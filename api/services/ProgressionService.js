import { DomainEvents } from '../lib/domain-events.js';

export class ProgressionService {
  constructor(userRepository, eventBus) {
    this.userRepository = userRepository;
    this.eventBus = eventBus;
    
    // Subscribe to domain events
    this.eventBus.on(DomainEvents.QuestCompleted, this.handleQuestCompleted.bind(this));
  }

  async handleQuestCompleted(event) {
    const { userId, xpReward, coinReward } = event.payload;
    if (!xpReward && !coinReward) return;

    await this.userRepository.ensureUserProgress(userId);
    const progress = await this.userRepository.addXp(userId, xpReward);

    const newLevel = this.calculateLevelForXp(progress.xp);
    if (newLevel > progress.level) {
      await this.userRepository.updateLevel(userId, newLevel);
      await this.eventBus.publish(DomainEvents.LevelUp, {
        userId,
        oldLevel: progress.level,
        newLevel
      });
    }
  }

  calculateLevelForXp(totalXp) {
    let remaining = totalXp;
    let level = 1;
    const cost = (value) => value <= 20 ? 250 : value <= 40 ? 500 : value <= 60 ? 750 : value <= 80 ? 1000 : value <= 100 ? 1500 : 2000;
    while (remaining >= cost(level)) { 
      remaining -= cost(level); 
      level += 1; 
    }
    return level;
  }
}
