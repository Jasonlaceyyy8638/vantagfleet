-- Officer inspection page: lookup token and return session row for 4-hour + expiry check.
CREATE OR REPLACE FUNCTION public.get_inspect_token(p_token UUID)
RETURNS TABLE(created_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, org_id UUID, driver_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rt.created_at, rt.expires_at, rt.org_id, rt.driver_id
  FROM roadside_tokens rt
  WHERE rt.token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_inspect_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_inspect_token(UUID) TO authenticated;
