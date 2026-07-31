CREATE TABLE quest_templates (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT,
  xp_reward INT DEFAULT 0,
  coin_reward INT DEFAULT 0,
  estimated_duration INT, -- in minutes
  icon TEXT,
  rarity TEXT NOT NULL,
  requirements JSONB DEFAULT '{}',
  verification_type TEXT NOT NULL,
  created_by UUID, -- admin user id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  banner TEXT,
  theme TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'public',
  reward_pool JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_quests (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  quest_template_id UUID NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (campaign_id, quest_template_id)
);

CREATE TABLE eligibility_rules (
  id UUID PRIMARY KEY,
  quest_template_id UUID REFERENCES quest_templates(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  rule_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- We use a check constraint to ensure it belongs to either a template or campaign
ALTER TABLE eligibility_rules ADD CONSTRAINT chk_eligibility_target CHECK (quest_template_id IS NOT NULL OR campaign_id IS NOT NULL);

-- Create a new assignment table that references templates and doesn't duplicate data
CREATE TABLE live_quest_assignments (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL, -- references quest_users(id), but quest_users(id) is text
  quest_template_id UUID NOT NULL REFERENCES quest_templates(id),
  status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'active', 'pending_verification', 'completed', 'expired', 'abandoned'
  progress INT NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_live_assignments_user ON live_quest_assignments(user_id, status);

CREATE TABLE user_progress (
  user_id TEXT PRIMARY KEY,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'Adventurer',
  statistics JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  reward_type TEXT NOT NULL, -- 'xp', 'coin', 'badge', 'item'
  reward_value JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_events (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,
  target_value INT NOT NULL,
  current_value INT NOT NULL DEFAULT 0,
  reward_id UUID REFERENCES rewards(id),
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
