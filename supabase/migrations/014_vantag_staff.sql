/* VantagFleet staff team: display roles (Support, Sales, Manager, Admin). Access still gated by platform_roles. */

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vantag_staff_role') THEN
    EXECUTE 'CREATE TYPE vantag_staff_role AS ENUM (''Support'', ''Sales'', ''Manager'', ''Admin'')';
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.vantag_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role vantag_staff_role NOT NULL DEFAULT 'Support',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_vantag_staff_user_id ON public.vantag_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_vantag_staff_role ON public.vantag_staff(role);

ALTER TABLE public.vantag_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read vantag_staff" ON public.vantag_staff;
CREATE POLICY "Staff can read vantag_staff"
  ON public.vantag_staff FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = auth.uid())
  );

-- INSERT/UPDATE/DELETE: service role only (admin actions).
COMMENT ON TABLE public.vantag_staff IS 'VantagFleet team listing with roles (Support, Sales, Manager, Admin).';
