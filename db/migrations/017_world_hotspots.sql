-- Curated world hotspots for the Explore map.
--
-- The Explore map previously had no data source at all: WorldCanvas exported
-- `HOTSPOT_LOCATIONS = []` as a hardcoded placeholder. Player captures give the
-- map real geospatial content, but only after a player has captured something,
-- so a new account always saw an empty world.
--
-- This table holds curated nature locations (parks, waterfalls, birding sites)
-- that exist independently of any player's progress, so Explore is populated
-- from the first launch.

CREATE TABLE IF NOT EXISTS world_hotspots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- Matches the Explore category filter chips.
  category TEXT NOT NULL CHECK (category IN ('Hotspots', 'Parks', 'Waterfalls', 'Birding')),
  description TEXT NOT NULL DEFAULT '',
  -- Range checks only. These catch an out-of-range value (and therefore a swap
  -- where longitude exceeds ±90), but cannot detect a swap between two values
  -- that are both valid latitudes — coordinate ordering is asserted in tests.
  lat NUMERIC(9, 6) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng NUMERIC(9, 6) NOT NULL CHECK (lng BETWEEN -180 AND 180),
  -- Broad region label shown on the hotspot card.
  region TEXT,
  -- Species most likely to be found here, as ids from the species catalog.
  featured_species JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Demo/seed rows are flagged so real curated content can be told apart from
  -- development fixtures, and so a deployment can exclude them if it wants to.
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bounding-box lookups filter on both axes together.
CREATE INDEX IF NOT EXISTS world_hotspots_coords_idx ON world_hotspots (lat, lng) WHERE enabled;
CREATE INDEX IF NOT EXISTS world_hotspots_category_idx ON world_hotspots (category) WHERE enabled;
