/* Vantag Fleet: Multi-Tenant Trucking Compliance SaaS (IDEMPOTENT)
   Single-schema, row-level isolation via org_id.
   Safe to re-run: skips existing objects.
   Run this entire script in one go. */

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUM: Organization status (create only if not exists)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_status') THEN
    CREATE TYPE org_status AS ENUM ('active', 'suspended', 'trial');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- ENUM: User role (RBAC)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('Owner', 'Safety_Manager', 'Driver');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLE: organizations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  usdot_number TEXT,
  status org_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- TABLE: profiles (links auth.users to org + role)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'Driver',
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- Ensure profiles has required columns BEFORE any indexes or policies (Supabase may have created it with id only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
      ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      UPDATE profiles SET user_id = id WHERE id IS NOT NULL;
      ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'org_id') THEN
      ALTER TABLE profiles ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
      ALTER TABLE profiles ADD COLUMN role app_role NOT NULL DEFAULT 'Driver';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);

-- -----------------------------------------------------------------------------
-- TABLE: organization_members (for invites / multi-org membership)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'Driver',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);

-- -----------------------------------------------------------------------------
-- TABLE: drivers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_number TEXT,
  license_state TEXT,
  med_card_expiry DATE,
  clearinghouse_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_org_id ON drivers(org_id);

-- -----------------------------------------------------------------------------
-- TABLE: vehicles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_number TEXT,
  vin TEXT,
  plate TEXT,
  annual_inspection_due DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(org_id);

-- -----------------------------------------------------------------------------
-- TABLE: compliance_docs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_docs_org_id ON compliance_docs(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_driver_id ON compliance_docs(driver_id);
CREATE INDEX IF NOT EXISTS idx_compliance_docs_expiry ON compliance_docs(expiry_date);

-- -----------------------------------------------------------------------------
-- HELPER: Get current user's org_ids (from profiles + accepted org_members)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- RLS: Enable on all tenant tables
-- -----------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_docs ENABLE ROW LEVEL SECURITY;

-- Organizations
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can update own organization" ON organizations;
CREATE POLICY "Owners can update own organization"
  ON organizations FOR UPDATE
  USING (id IN (SELECT public.user_org_ids()));

-- Profiles
DROP POLICY IF EXISTS "Users can view profiles in own orgs" ON profiles;
CREATE POLICY "Users can view profiles in own orgs"
  ON profiles FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can insert own profile for an org they belong or are invited to" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile for org they belong to or claim" ON profiles;
CREATE POLICY "Users can insert own profile for an org they belong or are invited to"
  ON profiles FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      org_id IN (SELECT public.user_org_ids())
      OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Organization members
DROP POLICY IF EXISTS "Users can view org members in own orgs" ON organization_members;
CREATE POLICY "Users can view org members in own orgs"
  ON organization_members FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Owners and Safety_Managers can insert org members" ON organization_members;
CREATE POLICY "Owners and Safety_Managers can insert org members"
  ON organization_members FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = organization_members.org_id
      AND p.role IN ('Owner', 'Safety_Manager')
    )
  );

-- Drivers
DROP POLICY IF EXISTS "Users can view drivers in own orgs" ON drivers;
CREATE POLICY "Users can view drivers in own orgs"
  ON drivers FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can insert drivers in own orgs" ON drivers;
CREATE POLICY "Users can insert drivers in own orgs"
  ON drivers FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can update drivers in own orgs" ON drivers;
CREATE POLICY "Users can update drivers in own orgs"
  ON drivers FOR UPDATE
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can delete drivers in own orgs" ON drivers;
CREATE POLICY "Users can delete drivers in own orgs"
  ON drivers FOR DELETE
  USING (org_id IN (SELECT public.user_org_ids()));

-- Vehicles
DROP POLICY IF EXISTS "Users can view vehicles in own orgs" ON vehicles;
CREATE POLICY "Users can view vehicles in own orgs"
  ON vehicles FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can insert vehicles in own orgs" ON vehicles;
CREATE POLICY "Users can insert vehicles in own orgs"
  ON vehicles FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can update vehicles in own orgs" ON vehicles;
CREATE POLICY "Users can update vehicles in own orgs"
  ON vehicles FOR UPDATE
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can delete vehicles in own orgs" ON vehicles;
CREATE POLICY "Users can delete vehicles in own orgs"
  ON vehicles FOR DELETE
  USING (org_id IN (SELECT public.user_org_ids()));

-- Compliance docs
DROP POLICY IF EXISTS "Users can view compliance_docs in own orgs" ON compliance_docs;
CREATE POLICY "Users can view compliance_docs in own orgs"
  ON compliance_docs FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can insert compliance_docs in own orgs" ON compliance_docs;
CREATE POLICY "Users can insert compliance_docs in own orgs"
  ON compliance_docs FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can update compliance_docs in own orgs" ON compliance_docs;
CREATE POLICY "Users can update compliance_docs in own orgs"
  ON compliance_docs FOR UPDATE
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can delete compliance_docs in own orgs" ON compliance_docs;
CREATE POLICY "Users can delete compliance_docs in own orgs"
  ON compliance_docs FOR DELETE
  USING (org_id IN (SELECT public.user_org_ids()));

-- -----------------------------------------------------------------------------
-- TRIGGER: updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS drivers_updated_at ON drivers;
CREATE TRIGGER drivers_updated_at
  BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS vehicles_updated_at ON vehicles;
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS compliance_docs_updated_at ON compliance_docs;
CREATE TRIGGER compliance_docs_updated_at
  BEFORE UPDATE ON compliance_docs FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
