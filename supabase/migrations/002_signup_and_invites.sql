-- =============================================================================
-- Sign-up flow: allow claiming org (first profile per org) + org_invites
-- Orgs are created via Server Action with service role during sign-up.
-- If profiles exists without user_id (e.g. Supabase default), we add it.
-- Run 001 first; this file also ensures public.user_org_ids() exists.
-- =============================================================================

-- Ensure public.user_org_ids() exists (in case 001 was not run or failed partway)
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL
  UNION
  SELECT org_id FROM organization_members
  WHERE user_id = auth.uid() AND accepted_at IS NOT NULL;
$$;

-- Ensure profiles has user_id (Supabase default profile uses "id" as auth link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Backfill from id when profiles.id is the auth user reference
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
    ) THEN
      UPDATE profiles SET user_id = id WHERE user_id IS NULL;
    END IF;
    ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'org_id'
  ) THEN
    -- Add as nullable so existing rows don't fail; app assigns org on sign-up
    ALTER TABLE profiles ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role app_role NOT NULL DEFAULT 'Driver';
  END IF;
END $$;

-- Allow new user to create profile for an org that has no members yet (claim org)
DROP POLICY IF EXISTS "Users can insert own profile for an org they belong or are invited to" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile for org they belong to or claim" ON profiles;
CREATE POLICY "Users can insert own profile for org they belong to or claim"
  ON profiles FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      org_id IN (SELECT public.user_org_ids())
      OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = profiles.org_id
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = o.id)
      )
    )
  );

-- -----------------------------------------------------------------------------
-- TABLE: org_invites (for invite links)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_token ON org_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON org_invites(org_id);

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Org members can create invites for their org
DROP POLICY IF EXISTS "Org members can create invites" ON org_invites;
CREATE POLICY "Org members can create invites"
  ON org_invites FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.user_org_ids())
  );

DROP POLICY IF EXISTS "Org members can view their org invites" ON org_invites;
CREATE POLICY "Org members can view their org invites"
  ON org_invites FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

-- Allow anyone to read invite by token (for validation on /invite page)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(invite_token TEXT)
RETURNS TABLE(org_id UUID, org_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.org_id, o.name
  FROM org_invites i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.token = invite_token
  AND (i.expires_at IS NULL OR i.expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO authenticated;
