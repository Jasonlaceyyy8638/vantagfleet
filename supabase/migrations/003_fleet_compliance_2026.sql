/* Vantag Fleet 2026: Drivers (CDL/med/clearinghouse), Vehicles (VIN/DOT/maintenance),
   Compliance_Reminders, Loads (revenue/deadhead/fuel/detention), Inspections (DVIR).
   Multi-tenant: all tables have org_id. Run after 001 and 002. */

-- =============================================================================
-- DRIVERS: Ensure CDL and clearinghouse fields (existing table, add cdl_number if missing)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'cdl_number') THEN
    ALTER TABLE drivers ADD COLUMN cdl_number TEXT;
    UPDATE drivers SET cdl_number = license_number WHERE license_number IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN drivers.license_number IS 'CDL number (legacy); prefer cdl_number for new data.';
COMMENT ON COLUMN drivers.med_card_expiry IS 'Medical card expiration date.';
COMMENT ON COLUMN drivers.clearinghouse_status IS 'FMCSA Clearinghouse status (e.g. compliant, not queried).';

-- =============================================================================
-- VEHICLES: Add DOT number and maintenance logs table
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'dot_number') THEN
    ALTER TABLE vehicles ADD COLUMN dot_number TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vehicle_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  mileage_odometer INTEGER,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_logs_org_id ON vehicle_maintenance_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_logs_vehicle_id ON vehicle_maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_logs_log_date ON vehicle_maintenance_logs(log_date);

-- =============================================================================
-- ENUM: Compliance reminder type
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_reminder_type') THEN
    CREATE TYPE compliance_reminder_type AS ENUM ('Medical', 'CDL', 'IFTA');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_reminder_status') THEN
    CREATE TYPE compliance_reminder_status AS ENUM ('pending', 'sent', 'dismissed');
  END IF;
END $$;

-- =============================================================================
-- TABLE: compliance_reminders (upcoming expirations: Medical, CDL, IFTA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS compliance_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reminder_type compliance_reminder_type NOT NULL,
  entity_type TEXT NOT NULL, /* 'driver', 'vehicle', 'compliance_doc', 'ifta' */
  entity_id UUID, /* driver_id, vehicle_id, or compliance_doc id */
  due_date DATE NOT NULL,
  reminder_at TIMESTAMPTZ, /* when to send reminder; can be before due_date */
  status compliance_reminder_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_reminders_org_id ON compliance_reminders(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reminders_due_date ON compliance_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_reminders_status ON compliance_reminders(status);

-- =============================================================================
-- TABLE: loads (revenue, deadhead, fuel, detention for profit calculations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  load_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  deadhead_miles NUMERIC(10,2) NOT NULL DEFAULT 0,
  fuel_cost_cents INTEGER NOT NULL DEFAULT 0,
  detention_time_minutes INTEGER NOT NULL DEFAULT 0,
  loaded_miles NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loads_org_id ON loads(org_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver_id ON loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_vehicle_id ON loads(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_loads_load_date ON loads(load_date);

-- =============================================================================
-- ENUM: DVIR inspection type
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dvir_inspection_type') THEN
    CREATE TYPE dvir_inspection_type AS ENUM ('pre_trip', 'post_trip');
  END IF;
END $$;

-- =============================================================================
-- TABLE: inspections (DVIR – pre/post-trip checklists with image URLs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  inspection_type dvir_inspection_type NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  defects TEXT, /* free-form or JSON list of defects */
  image_urls TEXT[] DEFAULT '{}', /* array of image URLs (Supabase Storage or external) */
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_org_id ON inspections(org_id);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_driver_id ON inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_inspections_completed_at ON inspections(completed_at);

-- =============================================================================
-- RLS: Enable and policies for new tables (org-scoped)
-- =============================================================================
ALTER TABLE vehicle_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- vehicle_maintenance_logs
DROP POLICY IF EXISTS "Users can view vehicle_maintenance_logs in own orgs" ON vehicle_maintenance_logs;
CREATE POLICY "Users can view vehicle_maintenance_logs in own orgs"
  ON vehicle_maintenance_logs FOR SELECT USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can insert vehicle_maintenance_logs in own orgs" ON vehicle_maintenance_logs;
CREATE POLICY "Users can insert vehicle_maintenance_logs in own orgs"
  ON vehicle_maintenance_logs FOR INSERT WITH CHECK (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can update vehicle_maintenance_logs in own orgs" ON vehicle_maintenance_logs;
CREATE POLICY "Users can update vehicle_maintenance_logs in own orgs"
  ON vehicle_maintenance_logs FOR UPDATE USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can delete vehicle_maintenance_logs in own orgs" ON vehicle_maintenance_logs;
CREATE POLICY "Users can delete vehicle_maintenance_logs in own orgs"
  ON vehicle_maintenance_logs FOR DELETE USING (org_id IN (SELECT public.user_org_ids()));

-- compliance_reminders
DROP POLICY IF EXISTS "Users can view compliance_reminders in own orgs" ON compliance_reminders;
CREATE POLICY "Users can view compliance_reminders in own orgs"
  ON compliance_reminders FOR SELECT USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can insert compliance_reminders in own orgs" ON compliance_reminders;
CREATE POLICY "Users can insert compliance_reminders in own orgs"
  ON compliance_reminders FOR INSERT WITH CHECK (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can update compliance_reminders in own orgs" ON compliance_reminders;
CREATE POLICY "Users can update compliance_reminders in own orgs"
  ON compliance_reminders FOR UPDATE USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can delete compliance_reminders in own orgs" ON compliance_reminders;
CREATE POLICY "Users can delete compliance_reminders in own orgs"
  ON compliance_reminders FOR DELETE USING (org_id IN (SELECT public.user_org_ids()));

-- loads
DROP POLICY IF EXISTS "Users can view loads in own orgs" ON loads;
CREATE POLICY "Users can view loads in own orgs"
  ON loads FOR SELECT USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can insert loads in own orgs" ON loads;
CREATE POLICY "Users can insert loads in own orgs"
  ON loads FOR INSERT WITH CHECK (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can update loads in own orgs" ON loads;
CREATE POLICY "Users can update loads in own orgs"
  ON loads FOR UPDATE USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can delete loads in own orgs" ON loads;
CREATE POLICY "Users can delete loads in own orgs"
  ON loads FOR DELETE USING (org_id IN (SELECT public.user_org_ids()));

-- inspections
DROP POLICY IF EXISTS "Users can view inspections in own orgs" ON inspections;
CREATE POLICY "Users can view inspections in own orgs"
  ON inspections FOR SELECT USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can insert inspections in own orgs" ON inspections;
CREATE POLICY "Users can insert inspections in own orgs"
  ON inspections FOR INSERT WITH CHECK (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can update inspections in own orgs" ON inspections;
CREATE POLICY "Users can update inspections in own orgs"
  ON inspections FOR UPDATE USING (org_id IN (SELECT public.user_org_ids()));
DROP POLICY IF EXISTS "Users can delete inspections in own orgs" ON inspections;
CREATE POLICY "Users can delete inspections in own orgs"
  ON inspections FOR DELETE USING (org_id IN (SELECT public.user_org_ids()));

-- =============================================================================
-- TRIGGERS: updated_at for new tables
-- =============================================================================
DROP TRIGGER IF EXISTS vehicle_maintenance_logs_updated_at ON vehicle_maintenance_logs;
CREATE TRIGGER vehicle_maintenance_logs_updated_at
  BEFORE UPDATE ON vehicle_maintenance_logs FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS compliance_reminders_updated_at ON compliance_reminders;
CREATE TRIGGER compliance_reminders_updated_at
  BEFORE UPDATE ON compliance_reminders FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS loads_updated_at ON loads;
CREATE TRIGGER loads_updated_at
  BEFORE UPDATE ON loads FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS inspections_updated_at ON inspections;
CREATE TRIGGER inspections_updated_at
  BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
