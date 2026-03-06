-- Vantag staff invite flow: new users get a link to set their own password (no temp password).
CREATE TABLE IF NOT EXISTS public.vantag_staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Support', 'Sales', 'Manager', 'Admin', 'Billing')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vantag_staff_invites_token ON public.vantag_staff_invites(token);
CREATE INDEX IF NOT EXISTS idx_vantag_staff_invites_email ON public.vantag_staff_invites(email);

ALTER TABLE public.vantag_staff_invites ENABLE ROW LEVEL SECURITY;

-- Only service role / admin client used for insert/select; no RLS policies for anon to read by token.
-- We use a SECURITY DEFINER function so invite accept page can validate token.
CREATE OR REPLACE FUNCTION public.get_vantag_staff_invite_by_token(invite_token TEXT)
RETURNS TABLE(email TEXT, role TEXT, full_name TEXT, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.email, i.role, i.full_name, i.phone
  FROM vantag_staff_invites i
  WHERE i.token = invite_token
  AND i.used_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_vantag_staff_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_vantag_staff_invite_by_token(TEXT) TO authenticated;

COMMENT ON TABLE public.vantag_staff_invites IS 'Invites for new VantagFleet staff; they set password via link.';
