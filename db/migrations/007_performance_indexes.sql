-- 007_performance_indexes.sql
-- Performance indexes to optimize quest assignment lookups, history queries, notification retrieval, feed ordering, and submission lookups.

CREATE INDEX IF NOT EXISTS quest_assignments_user_active_idx
  ON quest_assignments (user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS quest_assignments_user_period_idx
  ON quest_assignments (user_id, cadence, period_key);

CREATE INDEX IF NOT EXISTS quest_assignments_user_history_idx
  ON quest_assignments (user_id, updated_at DESC)
  WHERE status IN ('completed', 'expired', 'abandoned');

CREATE INDEX IF NOT EXISTS quest_submissions_assignment_idx
  ON quest_submissions (assignment_id, status);

CREATE INDEX IF NOT EXISTS quest_submissions_user_hash_idx
  ON quest_submissions (user_id, image_hash)
  WHERE image_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS quest_notifications_unread_idx
  ON quest_notifications (user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS quest_xp_ledger_user_idx
  ON quest_xp_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS collectible_unlocks_user_idx
  ON collectible_unlocks (user_id, unlocked_at DESC);
