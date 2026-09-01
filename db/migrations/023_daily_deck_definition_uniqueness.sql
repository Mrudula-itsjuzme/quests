-- Daily decks now contain multiple quests in the same category.
-- Keep one assignment per definition per user/cadence/period instead of one
-- assignment per category.
ALTER TABLE quest_assignments
  DROP CONSTRAINT IF EXISTS quest_assignments_user_id_cadence_period_key_category_key;

CREATE UNIQUE INDEX IF NOT EXISTS quest_assignments_user_period_definition_unique
  ON quest_assignments (user_id, cadence, period_key, definition_id);
