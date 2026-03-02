-- driver_invitations: store invite token and link to driver + org for email invite flow.
CREATE TABLE IF NOT EXISTS public.driver_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_invitations_token ON public.driver_invitations(token);
CREATE INDEX IF NOT EXISTS idx_driver_invitations_driver_id ON public.driver_invitations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_invitations_email ON public.driver_invitations(email);

ALTER TABLE public.driver_invitations ENABLE ROW LEVEL SECURITY;

-- Carrier dashboard: org members can manage invitations for their org's drivers.
CREATE POLICY "Org members can insert driver_invitations for their org"
  ON public.driver_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL
      UNION
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view driver_invitations for their org"
  ON public.driver_invitations FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL
      UNION
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update driver_invitations for their org"
  ON public.driver_invitations FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL
      UNION
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.driver_invitations IS 'Invitations sent to drivers; token used in /register/driver link.';

-- Validate and fetch invite by token (for /register/driver). Returns NULL if expired or invalid.
CREATE OR REPLACE FUNCTION public.get_driver_invite_by_token(invite_token TEXT)
RETURNS TABLE(driver_id UUID, org_id UUID, email TEXT, status TEXT, org_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT di.driver_id, di.org_id, di.email, di.status, o.name
  FROM driver_invitations di
  JOIN organizations o ON o.id = di.org_id
  WHERE di.token = invite_token
    AND di.expires_at > now()
    AND di.status = 'pending';
$$;

GRANT EXECUTE ON FUNCTION public.get_driver_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_driver_invite_by_token(TEXT) TO authenticated;

-- profiles.driver_id: link a profile to a driver record (for driver role).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_driver_id ON public.profiles(driver_id);
COMMENT ON COLUMN public.profiles.driver_id IS 'When set, this profile is the driver portal identity for that driver record.';
