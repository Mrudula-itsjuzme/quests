CREATE TABLE IF NOT EXISTS captured_cards (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  capture_id UUID,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  card_title TEXT NOT NULL,
  rarity_tier TEXT NOT NULL,
  rarity_score NUMERIC(5,4) NOT NULL CHECK (rarity_score >= 0 AND rarity_score <= 1),
  description TEXT,
  image_ref TEXT,
  image_hash TEXT,
  status TEXT NOT NULL DEFAULT 'final' CHECK (status IN ('processing','final','provisional','rejected')),
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy_m DOUBLE PRECISION,
  gps_altitude DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anti_cheat_verdict TEXT,
  anti_cheat_reason TEXT,
  anti_cheat_detail JSONB NOT NULL DEFAULT '[]'::jsonb,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS captured_cards_capture_id_idx ON captured_cards (capture_id) WHERE capture_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS captured_cards_user_captured_idx ON captured_cards (user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS captured_cards_user_image_hash_idx ON captured_cards (user_id, image_hash) WHERE image_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS captured_cards_image_hash_idx ON captured_cards (image_hash) WHERE image_hash IS NOT NULL;
