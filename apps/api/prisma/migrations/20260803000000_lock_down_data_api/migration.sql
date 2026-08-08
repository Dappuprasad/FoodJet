-- Close the Supabase Data API off from these tables.
--
-- Supabase exposes every table in the `public` schema through PostgREST, where
-- access is governed by Row-Level Security. With RLS disabled, anyone holding
-- the project's anon key can read and write directly — around the API, its
-- validation and its authorisation rules. These tables hold password hashes,
-- session tokens, and customer names, phone numbers and addresses.
--
-- This application never uses that path: it connects to Postgres directly via
-- Prisma. So the goal is not to write access policies, it is to deny the Data
-- API roles entirely.
--
-- Enabling RLS with no policies denies all access to ordinary roles. The table
-- owner (`postgres`, which runs these migrations and serves the application)
-- bypasses RLS by default, so the application is unaffected.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_status_events" ENABLE ROW LEVEL SECURITY;

-- Belt and braces: revoke the grants themselves, so the Data API roles are
-- refused before RLS is even consulted. Guarded by a role-existence check
-- because `anon` and `authenticated` are Supabase-specific and absent on a
-- plain Postgres instance used for local development or CI.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE ALL ON SCHEMA public FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON SCHEMA public FROM authenticated;
  END IF;
END $$;
