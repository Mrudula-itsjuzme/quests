CREATE TABLE quest_generation_runs (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','monthly')),
  period_key TEXT NOT NULL CHECK (char_length(period_key) BETWEEN 1 AND 40),
  idempotency_key TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 160),
  status TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  assignment_count INTEGER NOT NULL DEFAULT 0 CHECK (assignment_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, cadence, period_key)
);
CREATE INDEX quest_generation_runs_user_idx
  ON quest_generation_runs (user_id, created_at DESC);

CREATE TABLE quest_daily_states (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL CHECK (period_key ~ '^\d{4}-\d{2}-\d{2}$'),
  total_assignments INTEGER NOT NULL DEFAULT 0 CHECK (total_assignments BETWEEN 0 AND 3),
  completed_assignments INTEGER NOT NULL DEFAULT 0 CHECK (completed_assignments BETWEEN 0 AND total_assignments),
  bonus_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  bonus_awarded_at TIMESTAMPTZ,
  streak_applied BOOLEAN NOT NULL DEFAULT FALSE,
  streak_after INTEGER CHECK (streak_after IS NULL OR streak_after >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, period_key),
  CHECK ((bonus_awarded = FALSE AND bonus_awarded_at IS NULL) OR (bonus_awarded = TRUE AND bonus_awarded_at IS NOT NULL)),
  CHECK (streak_applied = FALSE OR bonus_awarded = TRUE)
);
