-- Track when Motive (or other) data was last synced per integration.

ALTER TABLE public.carrier_integrations
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.carrier_integrations.last_synced_at IS 'When fleet data was last synced from this integration (e.g. Motive).';
