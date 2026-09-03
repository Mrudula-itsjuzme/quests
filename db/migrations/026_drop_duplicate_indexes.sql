-- 026_drop_duplicate_indexes.sql
-- Drop duplicate indexes flagged by Supabase Security/Health checks
DROP INDEX IF EXISTS public.quest_assignments_user_active_idx;
DROP INDEX IF EXISTS public.quest_submissions_hash_idx;
DROP INDEX IF EXISTS public.quest_submissions_user_hash_idx;
DROP INDEX IF EXISTS public.capture_xp_ledger_card_unique;
