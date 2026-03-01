-- Store last sync result for 5-minute cache (avoid hitting Motive repeatedly).

ALTER TABLE public.carrier_integrations
  ADD COLUMN IF NOT EXISTS last_sync_vehicles_count INTEGER,
  ADD COLUMN IF NOT EXISTS last_sync_drivers_count INTEGER;

COMMENT ON COLUMN public.carrier_integrations.last_sync_vehicles_count IS 'Cached vehicle count from last Motive sync (for 5-min cache).';
COMMENT ON COLUMN public.carrier_integrations.last_sync_drivers_count IS 'Cached driver count from last Motive sync (for 5-min cache).';
