CREATE TABLE IF NOT EXISTS quest_users (
  id TEXT PRIMARY KEY CHECK (char_length(id) BETWEEN 1 AND 200),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  timezone TEXT NOT NULL DEFAULT 'UTC' CHECK (char_length(timezone) BETWEEN 1 AND 80),
  total_xp BIGINT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_streak_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_definitions (
  id TEXT PRIMARY KEY CHECK (char_length(id) BETWEEN 1 AND 100),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  category TEXT NOT NULL CHECK (category IN ('Mind','Body','Discovery','Weekly','Monthly')),
  rarity TEXT NOT NULL CHECK (rarity IN ('Common','Uncommon','Rare','Epic','Legendary')),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','monthly','custom')),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('AUTO','PHOTO','TEXT')),
  subject_tag TEXT NOT NULL CHECK (char_length(subject_tag) BETWEEN 1 AND 100),
  target_value NUMERIC(12,2) NOT NULL CHECK (target_value > 0),
  unit TEXT NOT NULL CHECK (char_length(unit) BETWEEN 1 AND 40),
  cooldown_days INTEGER NOT NULL DEFAULT 3 CHECK (cooldown_days >= 0),
  xp_reward INTEGER NOT NULL CHECK (xp_reward BETWEEN 0 AND 3000),
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(instructions) = 'array'),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_assignments (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  definition_id TEXT NOT NULL REFERENCES quest_definitions(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  cadence TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  subject_tag TEXT NOT NULL,
  target_value NUMERIC(12,2) NOT NULL CHECK (target_value > 0),
  progress_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (progress_value >= 0),
  unit TEXT NOT NULL,
  xp_reward INTEGER NOT NULL CHECK (xp_reward >= 0),
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  period_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','pending_verification','completed','rejected','expired','abandoned')),
  assigned_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > starts_at),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, cadence, period_key, category)
);
CREATE INDEX IF NOT EXISTS quest_assignments_active_idx ON quest_assignments (user_id, status, expires_at);
CREATE INDEX IF NOT EXISTS quest_assignments_recent_idx ON quest_assignments (user_id, cadence, assigned_at DESC);

CREATE TABLE IF NOT EXISTS quest_submissions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES quest_assignments(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved','manual_review','rejected')),
  image_hash TEXT,
  confidence NUMERIC(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  feed_posted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quest_submissions_hash_idx ON quest_submissions (user_id, image_hash) WHERE image_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS quest_xp_ledger (
  id UUID PRIMARY KEY,
  ledger_key TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES quest_assignments(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL CHECK (reason IN ('quest_completion','daily_bonus','adjustment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quest_xp_ledger_user_idx ON quest_xp_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS collectible_unlocks (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  caption TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, asset_id)
);

CREATE TABLE IF NOT EXISTS quest_idempotency_keys (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (char_length(operation) BETWEEN 1 AND 160),
  key TEXT NOT NULL CHECK (char_length(key) BETWEEN 8 AND 160),
  status TEXT NOT NULL CHECK (status IN ('processing','completed')),
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, operation, key)
);
