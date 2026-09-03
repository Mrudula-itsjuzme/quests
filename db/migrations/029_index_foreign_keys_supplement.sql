-- 029_index_foreign_keys_supplement.sql
-- Create additional dedicated single-column indexes for foreign keys 
-- flagged by Supabase health checks that were not covered by 028.

CREATE INDEX IF NOT EXISTS captured_cards_user_id_fk_idx ON public.captured_cards(user_id);
CREATE INDEX IF NOT EXISTS captured_cards_species_id_fk_idx ON public.captured_cards(species_id);

CREATE INDEX IF NOT EXISTS coin_ledger_user_id_fk_idx ON public.coin_ledger(user_id);

CREATE INDEX IF NOT EXISTS community_post_comments_user_id_fk_idx ON public.community_post_comments(user_id);

CREATE INDEX IF NOT EXISTS community_post_reports_user_id_fk_idx ON public.community_post_reports(user_id);
