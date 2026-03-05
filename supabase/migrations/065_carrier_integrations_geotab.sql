-- Add 'geotab' as a provider for carrier_integrations (Geotab ELD integration).
ALTER TABLE public.carrier_integrations
  DROP CONSTRAINT IF EXISTS carrier_integrations_provider_check;

ALTER TABLE public.carrier_integrations
  ADD CONSTRAINT carrier_integrations_provider_check
  CHECK (provider IN ('samsara', 'motive', 'fmcsa', 'motus', 'geotab'));

COMMENT ON TABLE public.carrier_integrations IS 'Per-carrier API keys / OAuth / Geotab credentials for Samsara, Motive, FMCSA, Motus, Geotab.';
