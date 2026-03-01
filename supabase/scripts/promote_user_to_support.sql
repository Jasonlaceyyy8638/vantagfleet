-- =============================================================================
-- PROMOTE USER TO SUPPORT (by email)
-- =============================================================================
-- Default: info@vantagfleet.com. Change v_email below to promote a different user.
-- List users: SELECT id, email FROM auth.users;
-- =============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'info@vantagfleet.com';
BEGIN

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user with email % yet. Have someone sign up with that email, then run this script again. Or use promote_by_user_id.sql with an existing user id from Authentication → Users.', v_email;
    RETURN;
  END IF;

  INSERT INTO public.users (id, role)
  VALUES (v_user_id, 'SUPPORT')
  ON CONFLICT (id) DO UPDATE SET role = 'SUPPORT', updated_at = now();

  RAISE NOTICE 'Success: % promoted to SUPPORT (id: %)', v_email, v_user_id;
END $$;
