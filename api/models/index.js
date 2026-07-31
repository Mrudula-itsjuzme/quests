/**
 * @typedef {Object} QuestTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} difficulty
 * @property {number} xpReward
 * @property {number} coinReward
 * @property {number} estimatedDuration
 * @property {string} icon
 * @property {string} rarity
 * @property {Object} requirements
 * @property {string} verificationType
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} QuestAssignment
 * @property {string} id
 * @property {string} userId
 * @property {string} questTemplateId
 * @property {string} status - 'assigned', 'active', 'pending_verification', 'completed', 'failed', 'expired'
 * @property {number} progress
 * @property {string} assignedAt
 * @property {string} expiresAt
 * @property {string} completedAt
 */

/**
 * @typedef {Object} Campaign
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} banner
 * @property {string} theme
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} visibility
 * @property {Object} rewardPool
 * @property {string} status
 */

/**
 * @typedef {Object} CampaignQuest
 * @property {string} campaignId
 * @property {string} questTemplateId
 * @property {number} displayOrder
 */

/**
 * @typedef {Object} EligibilityRule
 * @property {string} id
 * @property {string} questTemplateId
 * @property {string} ruleType - 'level_range', 'user_group', 'premium_status', 'location', etc.
 * @property {Object} ruleValue - The configuration for the rule (e.g., { min: 5, max: 10 })
 */

/**
 * @typedef {Object} Reward
 * @property {string} id
 * @property {string} type - 'xp', 'coin', 'badge', 'item'
 * @property {number|string} value
 * @property {Object} metadata
 */

/**
 * @typedef {Object} UserProgress
 * @property {string} userId
 * @property {number} level
 * @property {number} xp
 * @property {number} coins
 * @property {number} streak
 * @property {string} rank
 * @property {Object} statistics
 */

export {};
