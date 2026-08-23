-- Human verification for provisional captures — blueprint §21.
--
-- A/S-grade and PASS_WITH_REVIEW captures are already minted with
-- status = 'provisional' (see 010_captures_trust_spine.sql), but there was
-- no admin decision path to ever move them to 'final' or 'rejected'. This
-- adds the review audit trail (mirroring quest_submissions' reviewed_at/
-- reviewed_by/review_reason from 006_full_quest_system.sql) so a provisional
-- capture has somewhere to go, and the decision is attributable and auditable
-- per §21's "admin decision overrides AI grades... every decision is logged
-- with reviewer id, timestamp, and reason."

ALTER TABLE captured_cards
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS human_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS captured_cards_provisional_idx ON captured_cards (status, captured_at) WHERE status = 'provisional';
