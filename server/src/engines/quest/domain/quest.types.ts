export type QuestCadence = 'daily' | 'weekly' | 'monthly';
export type QuestCategory = 'Mind' | 'Body' | 'Discovery';
export type QuestRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type VerificationType = 'PHOTO' | 'HEALTH' | 'MANUAL' | 'GPS' | 'TEXT' | 'AUTO';

export type AssignmentStatus =
  | 'assigned'
  | 'active'
  | 'pending_verification'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'abandoned';

export interface QuestDefinitionData {
  id: string;
  title: string;
  description: string;
  category: QuestCategory | string;
  cadence: QuestCadence | string;
  rarity: QuestRarity | string;
  verificationType: VerificationType | string;
  subjectTag: string;
  xpReward: number;
  cooldownDays: number;
  targetValue: number;
  unit: string;
  instructions: string[];
  enabled: boolean;
}

export interface RecentAssignmentRef {
  definitionId: string;
  subjectTag: string;
  assignedAt: Date;
  rarity: string;
}

export interface QuestPeriod {
  key: string;
  startsAt: Date;
  expiresAt: Date;
}

export interface GeneratedAssignmentDraft {
  definitionId: string;
  title: string;
  description: string;
  category: string;
  rarity: string;
  cadence: string;
  verificationType: string;
  subjectTag: string;
  targetValue: number;
  unit: string;
  xpReward: number;
  periodKey: string;
  startsAt: Date;
  expiresAt: Date;
}
