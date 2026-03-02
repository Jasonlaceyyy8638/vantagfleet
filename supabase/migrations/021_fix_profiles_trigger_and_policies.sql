-- =============================================================================
-- Fix signup errors:
-- 1) "insert or update on table 'profiles' violates foreign key constraint 'profiles_id_fkey'"
--    caused by inserting a random UUID into profiles.id when profiles.id references auth.users(id).
-- 2) "infinite recursion detected in policy for relation 'profiles'"
--    caused by a profiles INSERT policy that queried profiles inside its own definition.
--
-- Safe to run multiple times.
-- =============================================================================

-- Ensure org_id can be NULL (profile is created at signup; org linked later)
ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN org_id DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- Fix recursive policy on profiles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile for org they belong to or claim" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile for an org they belong or are invited to" ON public.profiles;

-- Users generally should NOT insert profiles directly (the trigger does it),
-- but keep a non-recursive, minimal INSERT policy for safety if needed.
DROP POLICY IF EXISTS "Users can insert own profile (non-recursive)" ON public.profiles;
CREATE POLICY "Users can insert own profile (non-recursive)"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
    AND user_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- Fix trigger function: always use NEW.id for profiles.id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure a matching profile row exists for every auth user.
  -- IMPORTANT: profiles.id must equal auth.users.id when profiles_id_fkey exists.
  INSERT INTO public.profiles (id, user_id, org_id, role, full_name)
  VALUES (
    NEW.id,
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Ensure a public.users row exists (used for role checks in app)
  INSERT INTO public.users (id, role)
  VALUES (NEW.id, 'CUSTOMER'::user_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'handle_new_user: %', SQLERRM;
END;
$$;

-- Ensure the trigger is present and points at the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

