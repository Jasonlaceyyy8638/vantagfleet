-- Team invite flow: store full_name/phone and used_at so new users set their own password via link (no temp password).
ALTER TABLE public.org_invites
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

COMMENT ON COLUMN public.org_invites.full_name IS 'Invitee full name (for team invite by email).';
COMMENT ON COLUMN public.org_invites.phone IS 'Invitee phone (for team invite by email).';
COMMENT ON COLUMN public.org_invites.used_at IS 'When the invite was accepted (token no longer valid).';

-- Allow Admin as invite role (terminal manager).
ALTER TABLE public.org_invites
  DROP CONSTRAINT IF EXISTS org_invites_invite_role_check;
ALTER TABLE public.org_invites
  ADD CONSTRAINT org_invites_invite_role_check
  CHECK (invite_role IN ('Driver', 'Dispatcher', 'Safety_Manager', 'Driver_Manager', 'Admin'));

-- Return email, full_name, phone so invite page can show "create your password" and we can create profile on accept.
DROP FUNCTION IF EXISTS public.get_invite_by_token(text);
CREATE FUNCTION public.get_invite_by_token(invite_token TEXT)
RETURNS TABLE(org_id UUID, org_name TEXT, invite_role TEXT, email TEXT, full_name TEXT, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.org_id, o.name, COALESCE(i.invite_role, 'Driver'), i.email, i.full_name, i.phone
  FROM org_invites i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.token = invite_token
  AND (i.expires_at IS NULL OR i.expires_at > now())
  AND i.used_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO authenticated;
