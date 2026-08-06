CREATE TABLE IF NOT EXISTS species (
  id TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  element TEXT NOT NULL CHECK (element IN ('Fire','Water','Grass','Earth','Sky')),
  category TEXT NOT NULL CHECK (category IN ('Flora','Fauna','Landscape','Heritage')),
  base_rarity NUMERIC(5,4) NOT NULL CHECK (base_rarity >= 0 AND base_rarity <= 1),
  regions TEXT[] NOT NULL DEFAULT '{}',
  seasonality_months INTEGER[] NOT NULL DEFAULT '{}',
  nocturnal BOOLEAN NOT NULL DEFAULT FALSE,
  sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  encyclopedia TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS species_element_idx ON species (element);
CREATE INDEX IF NOT EXISTS species_category_idx ON species (category);

CREATE TABLE IF NOT EXISTS species_discovery_stats (
  species_id TEXT PRIMARY KEY REFERENCES species(id) ON DELETE CASCADE,
  total_captures INTEGER NOT NULL DEFAULT 0,
  distinct_owners INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE captured_cards
  ADD COLUMN IF NOT EXISTS species_id TEXT REFERENCES species(id),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4);
