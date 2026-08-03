/** Shared queue name constants so engines register/reference the same queue by name, not a magic string. */
export const QueueName = {
  QuestGeneration: 'quest-generation',
  LiveOpsReconciliation: 'liveops-reconciliation',
  Verification: 'verification',
  Notifications: 'notifications',
  LeaderboardRebuild: 'leaderboard-rebuild',
  StreakSweep: 'streak-sweep',
} as const;

export type QueueNameValue = (typeof QueueName)[keyof typeof QueueName];
