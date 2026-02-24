-- =============================================
-- FIX: Enable pending recruiters and hustle access for admin dashboard
-- Matching the disabled RLS architecture from merchants
-- =============================================

ALTER TABLE recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE hustle_profiles DISABLE ROW LEVEL SECURITY;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
