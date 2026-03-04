-- Vehicles: add make, model, year, status (active/shop).
-- Drivers: add license_no, medical_card_expiry, assigned_vehicle_id (FK).

-- =============================================================================
-- VEHICLES
-- =============================================================================
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS make TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS year SMALLINT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_status_check CHECK (status IN ('active', 'shop'));

COMMENT ON COLUMN public.vehicles.make IS 'Vehicle make.';
COMMENT ON COLUMN public.vehicles.model IS 'Vehicle model.';
COMMENT ON COLUMN public.vehicles.year IS 'Model year.';
COMMENT ON COLUMN public.vehicles.status IS 'active or shop.';

-- =============================================================================
-- DRIVERS: assigned_vehicle_id FK, license_no, medical_card_expiry
-- =============================================================================
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS license_no TEXT,
  ADD COLUMN IF NOT EXISTS medical_card_expiry DATE;

-- Backfill from existing columns if present
UPDATE public.drivers SET license_no = license_number WHERE license_no IS NULL AND license_number IS NOT NULL;
UPDATE public.drivers SET medical_card_expiry = med_card_expiry WHERE medical_card_expiry IS NULL AND med_card_expiry IS NOT NULL;

COMMENT ON COLUMN public.drivers.assigned_vehicle_id IS 'FK to vehicles; assigned truck/unit for this driver.';
COMMENT ON COLUMN public.drivers.license_no IS 'Driver license number.';
COMMENT ON COLUMN public.drivers.medical_card_expiry IS 'Medical card expiration date.';

CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle_id ON public.drivers(assigned_vehicle_id);
