-- Add fleet_size to organizations for Org Setup form.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS fleet_size INTEGER;

COMMENT ON COLUMN public.organizations.fleet_size IS 'Number of vehicles in the fleet (optional).';
