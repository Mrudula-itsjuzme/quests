-- Add explicit indexes for foreign key columns flagged by Supabase health checks
-- This helps cascade/delete and FK lookups perform efficiently.

CREATE INDEX IF NOT EXISTS coin_ledger_card_idx ON coin_ledger (card_id);
CREATE INDEX IF NOT EXISTS coin_ledger_ledger_key_idx ON coin_ledger (ledger_key);

CREATE INDEX IF NOT EXISTS community_post_likes_post_idx ON community_post_likes (post_id);
CREATE INDEX IF NOT EXISTS community_post_likes_user_idx ON community_post_likes (user_id);

CREATE INDEX IF NOT EXISTS community_post_comments_post_idx ON community_post_comments (post_id) WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS community_post_reports_post_idx ON community_post_reports (post_id);

-- In case other FK referencing captured_cards are flagged, ensure common refs are indexed.
CREATE INDEX IF NOT EXISTS coin_ledger_card_idx_partial ON coin_ledger (card_id) WHERE card_id IS NOT NULL;
