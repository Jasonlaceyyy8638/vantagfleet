-- =============================================================================
-- FIX: "Database error creating new user" in Supabase
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor → New query.
-- Then try Authentication → Users → Create user again.
-- =============================================================================

-- 0) We use gen_random_uuid() (built-in in Postgres 13+) so no extension needed.

-- 1) Drop EVERY trigger on auth.users (so only our trigger runs)
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

-- 2) Ensure app_role enum exists (needed for profiles.role)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('Owner', 'Safety_Manager', 'Driver');
  END IF;
END $$;

-- 3) Ensure organizations exists first (profiles.org_id references it)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  usdot_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'status') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_status') THEN
      CREATE TYPE org_status AS ENUM ('active', 'suspended', 'trial');
    END IF;
    ALTER TABLE public.organizations ADD COLUMN status org_status NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- 4) Profiles: drop ALL check constraints on profiles (Supabase creates profiles_role_check which rejects 'Driver')
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'profiles' AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 5) Profiles: ensure table and columns exist (id, user_id, org_id, role, full_name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
      role app_role NOT NULL DEFAULT 'Driver',
      full_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  ELSE
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
      ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      UPDATE public.profiles SET user_id = id WHERE id IS NOT NULL;
      ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'org_id') THEN
      ALTER TABLE public.profiles ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
      ALTER TABLE public.profiles ADD COLUMN role app_role NOT NULL DEFAULT 'Driver';
    END IF;
    -- Ensure no conflicting check remains
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
      ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
  END IF;
END $$;

-- Allow org_id to be null for new signups
ALTER TABLE public.profiles ALTER COLUMN org_id DROP NOT NULL;

ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 6) Ensure user_role enum and public.users table exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'EMPLOYEE', 'ADMIN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'EMPLOYEE') THEN
    ALTER TYPE user_role ADD VALUE 'EMPLOYEE';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 7) Trigger: on new auth user, create profile row. Use column DEFAULT for id to avoid any function-call issues.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Profile row (id uses table default; do not call gen_random_uuid() here)
  INSERT INTO public.profiles (user_id, org_id, role, full_name)
  VALUES (
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );

  -- Best-effort: users row for admin portal
  BEGIN
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, 'CUSTOMER'::user_role)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'handle_new_user: %', SQLERRM;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Done. Try creating a user again in Authentication → Users.
