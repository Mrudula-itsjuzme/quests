ALTER TABLE quest_users
  ADD COLUMN IF NOT EXISTS feed_default_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS rank_percentile NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS rank_title TEXT NOT NULL DEFAULT 'Adventurer';

ALTER TABLE quest_submissions
  ADD COLUMN IF NOT EXISTS upload_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS review_reason TEXT;

ALTER TABLE quest_xp_ledger DROP CONSTRAINT IF EXISTS quest_xp_ledger_reason_check;
ALTER TABLE quest_xp_ledger
  ADD CONSTRAINT quest_xp_ledger_reason_check
  CHECK (reason IN ('quest_completion','daily_bonus','level_reward','adjustment'));

CREATE TABLE IF NOT EXISTS quest_feed_entries (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES quest_assignments(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES quest_submissions(id) ON DELETE CASCADE,
  quest_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  xp_earned INTEGER NOT NULL CHECK (xp_earned >= 0),
  rank_title TEXT NOT NULL,
  image_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id)
);
CREATE INDEX IF NOT EXISTS quest_feed_created_idx ON quest_feed_entries (created_at DESC);

CREATE TABLE IF NOT EXISTS quest_notifications (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  dedupe_key TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quest_notifications_user_idx ON quest_notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS quest_notifications_dedupe_idx
  ON quest_notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS quest_level_rewards (
  level INTEGER PRIMARY KEY CHECK (level > 1),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('xp','collectible','title','badge','chest')),
  reward_key TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1 CHECK (amount > 0),
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_user_rewards (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL REFERENCES quest_level_rewards(level),
  status TEXT NOT NULL DEFAULT 'claimable' CHECK (status IN ('claimable','claimed')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, level)
);

CREATE TABLE IF NOT EXISTS quest_inventory (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('collectible','title','badge','chest')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  label TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_key)
);

CREATE TABLE IF NOT EXISTS quest_rank_snapshots (
  snapshot_date DATE NOT NULL,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  percentile NUMERIC(6,3) NOT NULL CHECK (percentile BETWEEN 0 AND 100),
  rank_title TEXT NOT NULL,
  total_xp BIGINT NOT NULL CHECK (total_xp >= 0),
  PRIMARY KEY (snapshot_date, user_id)
);
CREATE INDEX IF NOT EXISTS quest_rank_position_idx ON quest_rank_snapshots (snapshot_date DESC, position);

INSERT INTO quest_level_rewards (level, reward_type, reward_key, amount, label)
VALUES
  (5, 'chest', 'bronze_chest', 1, 'Bronze Chest'),
  (10, 'badge', 'steadfast_badge', 1, 'Steadfast Badge'),
  (18, 'chest', 'mythril_chest', 1, 'Mythril Chest'),
  (19, 'title', 'path_scholar', 1, 'Path Scholar'),
  (20, 'badge', 'rare_path_badge', 1, 'Rare Path Badge'),
  (21, 'xp', 'silver_arrival_bonus', 250, 'Silver Arrival Bonus'),
  (40, 'title', 'golden_wayfarer', 1, 'Golden Wayfarer'),
  (60, 'chest', 'platinum_chest', 1, 'Platinum Chest'),
  (80, 'title', 'mythril_explorer', 1, 'Mythril Explorer'),
  (100, 'badge', 'diamond_legend', 1, 'Diamond Legend'),
  (120, 'title', 'ascendant', 1, 'The Ascendant')
ON CONFLICT (level) DO UPDATE SET
  reward_type = EXCLUDED.reward_type,
  reward_key = EXCLUDED.reward_key,
  amount = EXCLUDED.amount,
  label = EXCLUDED.label;

INSERT INTO quest_definitions
  (id,title,description,category,rarity,cadence,verification_type,subject_tag,target_value,unit,cooldown_days,xp_reward,instructions)
VALUES
  ('monthly-sunrise-atlas','Atlas of Dawn','Capture eight distinct dawns during the month.','Monthly','Legendary','monthly','PHOTO','monthly_sunrises',8,'photos',180,2000,'["Capture eight distinct dawns","Submit each dated photograph"]'),
  ('monthly-wild-places','Twelve Wild Places','Document twelve natural places during the month.','Monthly','Legendary','monthly','PHOTO','monthly_nature_places',12,'photos',180,2500,'["Visit twelve natural places","Submit one photograph per place"]'),
  ('monthly-reading-odyssey','The Reading Odyssey','Document six focused reading sessions.','Monthly','Epic','monthly','PHOTO','monthly_reading',6,'photos',90,1500,'["Complete six reading sessions","Submit one proof for each session"]'),
  ('monthly-movement','Thirty Days in Motion','Document twelve intentional movement sessions.','Monthly','Epic','monthly','PHOTO','monthly_movement',12,'photos',90,1800,'["Complete twelve movement sessions","Submit one proof per session"]'),
  ('monthly-city-stories','Stories of the City','Discover ten local landmarks and stories.','Monthly','Epic','monthly','PHOTO','monthly_landmarks',10,'photos',120,1700,'["Visit ten distinct landmarks","Submit one photograph per landmark"]'),
  ('monthly-plant-journal','The Living Field Guide','Create a photographic journal of fifteen plant species.','Monthly','Legendary','monthly','PHOTO','monthly_plants',15,'photos',180,3000,'["Find fifteen distinct species","Submit a clear photograph of each"]')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category,
  rarity = EXCLUDED.rarity, cadence = EXCLUDED.cadence, verification_type = EXCLUDED.verification_type,
  subject_tag = EXCLUDED.subject_tag, target_value = EXCLUDED.target_value, unit = EXCLUDED.unit,
  cooldown_days = EXCLUDED.cooldown_days, xp_reward = EXCLUDED.xp_reward,
  instructions = EXCLUDED.instructions, updated_at = NOW();
