-- Weight class (GVWR) and fuel type for VIN decode / IFTA.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS weight_class TEXT,
  ADD COLUMN IF NOT EXISTS fuel_type TEXT;

COMMENT ON COLUMN public.vehicles.weight_class IS 'From NHTSA GVWR decode; e.g. Class 8 for semi-trucks.';
COMMENT ON COLUMN public.vehicles.fuel_type IS 'From NHTSA FuelTypePrimary decode; e.g. Diesel, Gasoline.';
