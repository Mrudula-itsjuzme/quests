-- Coin wallet + ledger.
--
-- captured_cards.coins_awarded has been recorded since the rarity engine
-- shipped, but was never credited anywhere, so the UI derived a coin balance
-- from XP on the client. This makes coins a real, server-authoritative balance
-- backed by an append-only ledger, mirroring capture_xp_ledger.

CREATE TABLE IF NOT EXISTS coin_ledger (
  id UUID PRIMARY KEY,
  -- Natural key for the crediting event. Uniqueness makes every credit
  -- idempotent under retries and concurrent writers.
  ledger_key TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES captured_cards(id) ON DELETE CASCADE,
  -- Negative amounts are spends; the balance is the running sum.
  amount INTEGER NOT NULL CHECK (amount <> 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coin_ledger_user_idx ON coin_ledger (user_id, created_at DESC);

-- Backfill balances for captures that already credited XP (status 'final').
-- Provisional captures stay uncredited until review, matching the XP rule.
INSERT INTO coin_ledger (id, ledger_key, user_id, card_id, amount, reason, created_at)
SELECT gen_random_uuid(),
       'backfill:capture:' || c.id::text,
       c.user_id,
       c.id,
       c.coins_awarded,
       'capture_reward',
       c.captured_at
FROM captured_cards c
WHERE c.status = 'final' AND c.coins_awarded > 0
ON CONFLICT (ledger_key) DO NOTHING;
