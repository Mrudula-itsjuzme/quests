export class EligibilityService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async isEligible(userId, rules = []) {
    if (!rules || rules.length === 0) return true;

    const userProgress = await this.userRepository.getProgress(userId);
    if (!userProgress) return false;

    for (const rule of rules) {
      const isMet = await this.evaluateRule(userProgress, rule);
      if (!isMet) return false;
    }

    return true;
  }

  async evaluateRule(userProgress, rule) {
    switch (rule.ruleType) {
      case 'min_level':
        return userProgress.level >= (rule.ruleValue.level || 1);
      case 'max_level':
        return userProgress.level <= (rule.ruleValue.level || 999);
      case 'premium_only':
        // Assuming user profile would have premium status, defaulting to false for now
        return false; 
      case 'new_users_only':
        return userProgress.level === 1 && userProgress.xp < 100;
      default:
        // Unknown rules might be evaluated by other services or considered false
        console.warn(`Unknown eligibility rule type: ${rule.ruleType}`);
        return false;
    }
  }

  async filterEligibleUsers(userIds, rules) {
    const eligibleIds = [];
    for (const id of userIds) {
      if (await this.isEligible(id, rules)) {
        eligibleIds.push(id);
      }
    }
    return eligibleIds;
  }
}
