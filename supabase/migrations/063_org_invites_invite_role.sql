-- Enterprise: allow inviting as Dispatcher (limited access) vs Driver.
ALTER TABLE public.org_invites
  ADD COLUMN IF NOT EXISTS invite_role TEXT NOT NULL DEFAULT 'Driver'
  CHECK (invite_role IN ('Driver', 'Dispatcher'));

COMMENT ON COLUMN public.org_invites.invite_role IS 'Role to assign when invite is accepted: Driver or Dispatcher (Enterprise limited access).';

-- Return type changes (added invite_role); must drop then create.
DROP FUNCTION IF EXISTS public.get_invite_by_token(text);

CREATE FUNCTION public.get_invite_by_token(invite_token TEXT)
RETURNS TABLE(org_id UUID, org_name TEXT, invite_role TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.org_id, o.name, COALESCE(i.invite_role, 'Driver')
  FROM org_invites i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.token = invite_token
  AND (i.expires_at IS NULL OR i.expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO authenticated;
