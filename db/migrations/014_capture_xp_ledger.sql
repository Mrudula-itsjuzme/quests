CREATE TABLE IF NOT EXISTS capture_xp_ledger (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL UNIQUE REFERENCES captured_cards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS capture_xp_ledger_user_idx ON capture_xp_ledger (user_id, created_at DESC);
