CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  xp INTEGER NOT NULL,
  status TEXT NOT NULL,
  progress REAL NOT NULL,
  target TEXT NOT NULL,
  instructions TEXT[] NOT NULL,
  proof_type TEXT NOT NULL,
  cadence TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_events (
  id BIGSERIAL PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collectible_unlocks (
  account_key TEXT NOT NULL DEFAULT 'local-player',
  asset_id TEXT NOT NULL,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  caption TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_key, asset_id)
);

INSERT INTO quests (id, title, summary, detail, category, rarity, xp, status, progress, target, instructions, proof_type, cadence)
VALUES
  ('daily-focus', 'Morning Mindfulness', 'Complete a 10-minute breathing ritual and capture the feeling.', 'Sit somewhere calm, breathe slowly, and note one intention for the day.', 'Mind', 'Rare', 120, 'In Progress', 0.7, '7/10 days', ARRAY['Set a quiet timer','Breathe for 10 minutes','Write one line of gratitude'], 'photo', 'daily'),
  ('body-reset', 'Body Reset', 'Take a brisk walk and log how your energy feels after.', 'A short walk can reset your nervous system and improve your mood.', 'Body', 'Uncommon', 90, 'Awaiting Proof', 1.0, '1/1 proof', ARRAY['Walk for 15 minutes','Hydrate after','Upload a photo from your route'], 'photo', 'daily'),
  ('discovery', 'Weekly Discovery', 'Explore one new habit or experience and share a reflection.', 'Try something slightly unfamiliar and log what it taught you.', 'Discovery', 'Epic', 180, 'Not Started', 0.2, '3/5 prompts', ARRAY['Choose a new experience','Spend 20 minutes with it','Reflect in one sentence'], 'auto', 'weekly')
ON CONFLICT (id) DO NOTHING;
