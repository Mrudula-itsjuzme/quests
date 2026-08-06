CREATE TABLE IF NOT EXISTS rarity_weight_sets (
  version INTEGER PRIMARY KEY,
  weights JSONB NOT NULL,
  grade_bands JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS rarity_weight_sets_active_idx ON rarity_weight_sets (active) WHERE active;

INSERT INTO rarity_weight_sets (version, weights, grade_bands, active)
VALUES (
  1,
  '{"speciesBaseRarity":0.28,"regionalRarity":0.16,"discoveryFrequency":0.14,"seasonality":0.10,"timeOfDay":0.06,"weather":0.06,"photoQuality":0.08,"distanceTravelled":0.06,"firstDiscoveryBonus":0.06}'::jsonb,
  '{"D":[0,40],"C":[40,60],"B":[60,75],"A":[75,90],"S":[90,101]}'::jsonb,
  TRUE
)
ON CONFLICT (version) DO NOTHING;

ALTER TABLE captured_cards
  ADD COLUMN IF NOT EXISTS rarity_grade TEXT CHECK (rarity_grade IN ('D','C','B','A','S')),
  ADD COLUMN IF NOT EXISTS rarity_stars SMALLINT CHECK (rarity_stars BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rarity_weight_set_version INTEGER REFERENCES rarity_weight_sets(version),
  ADD COLUMN IF NOT EXISTS rarity_factor_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS xp_awarded INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins_awarded INTEGER NOT NULL DEFAULT 0;
