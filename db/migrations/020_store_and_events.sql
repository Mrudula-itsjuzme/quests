-- Store and inventory for the shop + regional events.
--
-- NOTE: the app's user table is `quest_users` (id is TEXT), and regions are
-- string labels (see world_hotspots.region), not a `regions` table. Earlier
-- drafts of this migration referenced `users` / `regions` which do not exist
-- and broke `npm run migrate`.

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE store_catalog (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chest', 'cosmetic', 'pass')),
  price_coins INT NOT NULL CHECK (price_coins >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some basic catalog items
INSERT INTO store_catalog (item_id, name, type, price_coins) VALUES
  ('bronze_chest', 'Bronze Chest', 'chest', 100),
  ('silver_chest', 'Silver Chest', 'chest', 300),
  ('gold_chest', 'Gold Chest', 'chest', 1000),
  ('event_chest_1', 'Verdant Event Chest', 'chest', 500);

CREATE TABLE regional_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Region is a string label (matching world_hotspots.region / hotspot ids),
  -- not a row in a `regions` table.
  region_id TEXT NOT NULL,
  chest_id TEXT NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  threshold INT NOT NULL DEFAULT 50,
  state TEXT NOT NULL CHECK (state IN ('accumulating', 'active', 'expired')) DEFAULT 'accumulating',
  active_until TIMESTAMPTZ,
  reward_pool_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(region_id, chest_id, state)
);

CREATE TABLE regional_event_contributors (
  event_id UUID NOT NULL REFERENCES regional_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);