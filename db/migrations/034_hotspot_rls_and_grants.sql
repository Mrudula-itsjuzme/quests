-- 034_hotspot_rls_and_grants.sql

ALTER TABLE public.saved_hotspots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all access" ON public.saved_hotspots FOR ALL TO public USING (false);

ALTER TABLE public.hotspot_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all access" ON public.hotspot_ratings FOR ALL TO public USING (false);
