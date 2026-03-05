-- Universal ELD source: all vehicles (Motive/Geotab) in one table with provider.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS geotab_id TEXT;

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_provider_check;
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_provider_check
  CHECK (provider IS NULL OR provider IN ('motive', 'geotab'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_org_geotab
  ON public.vehicles(org_id, geotab_id) WHERE geotab_id IS NOT NULL;

COMMENT ON COLUMN public.vehicles.provider IS 'ELD source: motive, geotab, or NULL for manually added vehicles.';
COMMENT ON COLUMN public.vehicles.geotab_id IS 'Geotab device id for sync upserts (like motive_id for Motive).';
