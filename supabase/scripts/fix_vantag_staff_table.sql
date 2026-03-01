-- Ensure vantag_staff has correct structure (run in Supabase SQL Editor if table was created without columns).

-- 1. Create enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vantag_staff_role') THEN
    EXECUTE 'CREATE TYPE vantag_staff_role AS ENUM (''Support'', ''Sales'', ''Manager'', ''Admin'')';
  END IF;
END$$;

-- 2. If table doesn't exist, create it fully
CREATE TABLE IF NOT EXISTS public.vantag_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role vantag_staff_role NOT NULL DEFAULT 'Support',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Add user_id if missing (e.g. table was created with wrong schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vantag_staff' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.vantag_staff ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.vantag_staff ADD CONSTRAINT vantag_staff_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- 4. Add role if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vantag_staff' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.vantag_staff ADD COLUMN role vantag_staff_role NOT NULL DEFAULT 'Support';
  END IF;
END$$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_vantag_staff_user_id ON public.vantag_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_vantag_staff_role ON public.vantag_staff(role);

-- 6. RLS
ALTER TABLE public.vantag_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read vantag_staff" ON public.vantag_staff;
CREATE POLICY "Staff can read vantag_staff"
  ON public.vantag_staff FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = auth.uid()));

COMMENT ON TABLE public.vantag_staff IS 'VantagFleet team listing with roles (Support, Sales, Manager, Admin).';
