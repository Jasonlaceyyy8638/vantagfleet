-- =============================================================================
-- Fix: "Database error saving new user" / "null value in column 'id' of relation 'profiles'"
-- When you invite or create a user, a trigger must insert a row into public.profiles.
-- Run this entire script in Supabase SQL Editor, then try Invite again.
-- If it still fails, check Dashboard → Logs → Postgres logs for the exact error.
-- =============================================================================

-- Allow new users to have a profile without an org (app assigns org on sign-up/invite)
ALTER TABLE public.profiles
  ALTER COLUMN org_id DROP NOT NULL;

-- Ensure id always has a default (in case table was created without it)
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Trigger function: create a profile row when a new auth user is created (signup or invite)
-- EXCEPTION block surfaces the real DB error in Postgres logs if something fails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, org_id, role, full_name)
  VALUES (
    uuid_generate_v4(),
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'handle_new_user: %', SQLERRM;
END;
$$;

-- Drop every known trigger on auth.users that might insert into profiles (so only ours runs)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;

-- Must be FOR EACH ROW so NEW is available (FOR EACH STATEMENT would make NEW null)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
