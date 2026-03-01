-- Add motive_id to drivers and vehicles for Motive sync upserts (unique per org).

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS motive_id TEXT;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS motive_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_org_motive
  ON public.drivers(org_id, motive_id) WHERE motive_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_org_motive
  ON public.vehicles(org_id, motive_id) WHERE motive_id IS NOT NULL;

COMMENT ON COLUMN public.drivers.motive_id IS 'Motive API user/driver id for sync upserts.';
COMMENT ON COLUMN public.vehicles.motive_id IS 'Motive API vehicle id for sync upserts.';
