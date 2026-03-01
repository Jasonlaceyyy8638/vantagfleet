-- =============================================================================
-- ADD PLATFORM ADMIN (for /admin console access)
-- =============================================================================
-- Use this to give yourself (or someone) access to the Admin area (/admin, Team, Support).
--
-- 1. In Supabase: Authentication → Users → copy the user's ID (UUID).
-- 2. Replace the UUID below (keep the quotes).
-- 3. Run this script.
-- =============================================================================

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000000';  -- Replace with real id from Authentication → Users
BEGIN
  IF v_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Replace the UUID with a real user id. In dashboard: Authentication → Users, copy the ID column.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'No auth user found with id: %. Get the id from Authentication → Users.', v_user_id;
  END IF;

  INSERT INTO public.platform_roles (user_id, role)
  VALUES (v_user_id, 'ADMIN')
  ON CONFLICT (user_id) DO UPDATE SET role = 'ADMIN';

  RAISE NOTICE 'User % is now a platform ADMIN. They can open /admin.', v_user_id;
END $$;
