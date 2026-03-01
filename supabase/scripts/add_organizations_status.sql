-- =============================================================================
-- FIX: "Could not find the 'status' column of 'organizations' in the schema cache"
-- Run this in Supabase SQL Editor, then try signup again.
-- =============================================================================

-- 1) Create org_status enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_status') THEN
    CREATE TYPE org_status AS ENUM ('active', 'suspended', 'trial');
  END IF;
END $$;

-- 2) Add status column to organizations if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.organizations
      ADD COLUMN status org_status NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Done. Signup should work now.
