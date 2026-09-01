-- 022_capture_xp_ledger_unique.sql
-- Fix: add a unique constraint on card_id in capture_xp_ledger so that a
-- network-timeout retry cannot INSERT a second XP credit for the same card.
-- The coin_ledger already has this via its ledger_key unique column; this
-- brings capture_xp_ledger into parity with that pattern.
--
-- ON CONFLICT DO NOTHING in createCapturedCard / reviewCapturedCard means
-- re-insertion is already safe — this constraint makes the DB enforce it
-- rather than relying solely on the application layer guard.

CREATE UNIQUE INDEX IF NOT EXISTS capture_xp_ledger_card_unique
  ON capture_xp_ledger (card_id);
