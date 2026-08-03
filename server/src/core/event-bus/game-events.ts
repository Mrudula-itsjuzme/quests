/**
 * Event name constants + payload contracts for the GameEventBus. This is the
 * single most load-bearing file for "no engine calls another engine
 * directly" — every cross-engine interaction has a typed entry here. An
 * engine publishes one of these and moves on; it never imports another
 * engine's application service to trigger a side effect.
 */
export const GameEventType = {
  // Identity Engine
  PlayerRegistered: 'identity.player_registered',

  // Quest Engine
  QuestAssigned: 'quest.assigned',
  QuestSubmissionReceived: 'quest.submission_received',
  QuestCompleted: 'quest.completed',
  QuestExpired: 'quest.expired',
  QuestAbandoned: 'quest.abandoned',
  QuestChainAdvanced: 'quest.chain_advanced',

  // Verification Engine
  SubmissionVerified: 'verification.submission_verified',
  ContentDifficultySignal: 'verification.content_difficulty_signal',
  ModerationFlagged: 'verification.moderation_flagged',

  // Progression Engine
  XpGranted: 'progression.xp_granted',
  LevelUp: 'progression.level_up',
  TierPromoted: 'progression.tier_promoted',
  StreakExtended: 'progression.streak_extended',
  StreakBroken: 'progression.streak_broken',

  // Economy Engine
  CurrencyGranted: 'economy.currency_granted',
  CurrencySpent: 'economy.currency_spent',
  PurchaseCompleted: 'economy.purchase_completed',

  // Achievement Engine
  AchievementUnlocked: 'achievement.unlocked',

  // LiveOps Engine
  SeasonStarted: 'liveops.season_started',
  SeasonEnded: 'liveops.season_ended',
  WorldEventProgressed: 'liveops.world_event_progressed',
  WorldEventCompleted: 'liveops.world_event_completed',
  BattlePassTierClaimed: 'liveops.battle_pass_tier_claimed',

  // Community Engine
  FeedPostCreated: 'community.feed_post_created',
  GuildQuestProgressed: 'community.guild_quest_progressed',
  LeaderboardRankChanged: 'community.leaderboard_rank_changed',
} as const;

export type GameEventName = (typeof GameEventType)[keyof typeof GameEventType];

// ---- Identity ----
export interface PlayerRegisteredPayload {
  userId: string;
}

// ---- Quest ----
export interface QuestAssignedPayload {
  userId: string;
  assignmentId: string;
  definitionId: string;
  cadence: string;
  periodKey: string;
}

export interface QuestSubmissionReceivedPayload {
  userId: string;
  assignmentId: string;
  submissionId: string;
  verificationType: string;
  subjectTag: string;
  text?: string;
  uploadId?: string;
}

export interface QuestCompletedPayload {
  userId: string;
  assignmentId: string;
  definitionId: string;
  cadence: string;
  category: string;
  rarity: string;
  xpReward: number;
  coinReward?: number;
  periodKey: string;
  completedAt: string;
}

export interface QuestExpiredPayload {
  userId: string;
  assignmentId: string;
  definitionId: string;
  cadence: string;
}

export interface QuestAbandonedPayload {
  userId: string;
  assignmentId: string;
  definitionId: string;
}

export interface QuestChainAdvancedPayload {
  userId: string;
  chainContentId: string;
  newChapter: number;
}

// ---- Verification ----
export type VerificationDecision = 'approved' | 'manual_review' | 'rejected';

export interface SubmissionVerifiedPayload {
  userId: string;
  assignmentId: string;
  submissionId: string;
  decision: VerificationDecision;
  confidence?: number;
  imageHash?: string;
}

export interface ContentDifficultySignalPayload {
  definitionId: string;
  approvalRate: number;
  sampleSize: number;
}

export interface ModerationFlaggedPayload {
  userId: string;
  submissionId?: string;
  reason: string;
}

// ---- Progression ----
export interface XpGrantedPayload {
  userId: string;
  amount: number;
  source: string;
  sourceRefId: string;
}

export interface LevelUpPayload {
  userId: string;
  previousLevel: number;
  newLevel: number;
  totalXp: number;
}

export interface TierPromotedPayload {
  userId: string;
  previousTier: string;
  newTier: string;
}

export interface StreakExtendedPayload {
  userId: string;
  currentStreak: number;
  periodKey: string;
}

export interface StreakBrokenPayload {
  userId: string;
  previousStreak: number;
}

// ---- Economy ----
export interface CurrencyGrantedPayload {
  userId: string;
  currencyCode: string;
  amount: number;
  source: string;
  sourceRefId?: string;
}

export interface CurrencySpentPayload {
  userId: string;
  currencyCode: string;
  amount: number;
  reason: string;
}

export interface PurchaseCompletedPayload {
  userId: string;
  storeItemId: string;
  currencyCode: string;
  amount: number;
}

// ---- Achievement ----
export interface AchievementUnlockedPayload {
  userId: string;
  achievementId: string;
}

// ---- LiveOps ----
export interface SeasonStartedPayload {
  seasonContentId: string;
}

export interface SeasonEndedPayload {
  seasonContentId: string;
}

export interface WorldEventProgressedPayload {
  eventContentId: string;
  currentValue: number;
  targetValue: number;
}

export interface WorldEventCompletedPayload {
  eventContentId: string;
}

export interface BattlePassTierClaimedPayload {
  userId: string;
  seasonContentId: string;
  tierId: string;
}

// ---- Community ----
export interface FeedPostCreatedPayload {
  userId: string;
  assignmentId: string;
  feedPostId: string;
}

export interface GuildQuestProgressedPayload {
  guildId: string;
  assignmentId: string;
  progressValue: number;
}

export interface LeaderboardRankChangedPayload {
  userId: string;
  board: string;
  newRank: number;
}
