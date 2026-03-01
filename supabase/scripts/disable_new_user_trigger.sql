-- =============================================================================
-- RUN THIS if "Database error saving new user" or "profiles_role_check" won't fix.
-- This REMOVES the trigger so Auth user creation always succeeds.
-- Your app will create the profile in createProfileAfterSignUp() right after signup.
-- =============================================================================

-- Drop every trigger on auth.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
  END LOOP;
END $$;

-- Done. Try signup again; the app creates the profile on the next step.
