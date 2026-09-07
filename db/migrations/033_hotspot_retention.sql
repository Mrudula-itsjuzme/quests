-- Public saved places and one rating per explorer/place.
CREATE TABLE IF NOT EXISTS saved_hotspots (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  hotspot_id TEXT NOT NULL REFERENCES world_hotspots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, hotspot_id)
);

CREATE INDEX IF NOT EXISTS saved_hotspots_public_idx
  ON saved_hotspots (hotspot_id, created_at DESC);

CREATE TABLE IF NOT EXISTS hotspot_ratings (
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  hotspot_id TEXT NOT NULL REFERENCES world_hotspots(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, hotspot_id)
);

CREATE INDEX IF NOT EXISTS hotspot_ratings_summary_idx
  ON hotspot_ratings (hotspot_id);
