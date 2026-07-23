ALTER TABLE quest_users
  ADD COLUMN IF NOT EXISTS primary_path TEXT,
  ADD COLUMN IF NOT EXISTS reminder_time TIME,
  ADD COLUMN IF NOT EXISTS motion_preference TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tour_version_seen INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quest_users_primary_path_check'
  ) THEN
    ALTER TABLE quest_users
      ADD CONSTRAINT quest_users_primary_path_check
      CHECK (primary_path IS NULL OR primary_path IN ('Mind', 'Body', 'Discovery'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quest_users_motion_preference_check'
  ) THEN
    ALTER TABLE quest_users
      ADD CONSTRAINT quest_users_motion_preference_check
      CHECK (motion_preference IN ('system', 'full', 'reduced'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quest_users_tour_version_seen_check'
  ) THEN
    ALTER TABLE quest_users
      ADD CONSTRAINT quest_users_tour_version_seen_check
      CHECK (tour_version_seen >= 0);
  END IF;
END $$;
