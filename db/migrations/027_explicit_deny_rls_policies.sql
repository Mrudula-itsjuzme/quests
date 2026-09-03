-- 027_explicit_deny_rls_policies.sql
-- Creates explicit "deny all" policies for all public tables.
-- This resolves the Supabase "RLS Enabled No Policy" warning while
-- preserving the desired security posture (backend-only access).

CREATE POLICY "Deny all access" ON public.account_deletion_requests FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.capture_media FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.capture_xp_ledger FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.captured_cards FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.coin_ledger FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.collectible_unlocks FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.community_friendships FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.community_post_comments FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.community_post_likes FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.community_post_reports FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.community_posts FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_assignments FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_daily_states FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_definitions FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_feed_entries FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_generation_runs FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_idempotency_keys FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_inventory FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_level_rewards FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_notifications FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_rank_snapshots FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_submissions FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_user_rewards FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_users FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.quest_xp_ledger FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.rarity_weight_sets FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.schema_migrations FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.species FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.world_hotspots FOR ALL TO public USING (false);
