-- =============================================================================
-- PROMOTE USER TO SUPPORT BY USER ID (no email needed)
-- =============================================================================
-- Use this when you don't have employee emails yet. After someone signs up:
--
-- 1. In Supabase: Authentication → Users (or run SELECT id, email FROM auth.users;)
-- 2. Copy that user's UUID and replace the one below (keep the quotes).
-- 3. Run this script.
-- =============================================================================

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000000';  -- Replace with real id from auth.users
BEGIN
  IF v_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Replace the UUID with a real user id. In dashboard: Authentication → Users, or run: SELECT id, email FROM auth.users;';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'No auth user found with id: %. Get the id from Authentication → Users.', v_user_id;
  END IF;

  INSERT INTO public.users (id, role)
  VALUES (v_user_id, 'SUPPORT')
  ON CONFLICT (id) DO UPDATE SET role = 'SUPPORT', updated_at = now();

  RAISE NOTICE 'User % promoted to SUPPORT.', v_user_id;
END $$;
