-- Increase allowed daily total assignments to support a 10-quest daily deck
ALTER TABLE quest_daily_states
  DROP CONSTRAINT IF EXISTS quest_daily_states_total_assignments_check,
  ADD CONSTRAINT quest_daily_states_total_assignments_check CHECK (total_assignments BETWEEN 0 AND 10);
