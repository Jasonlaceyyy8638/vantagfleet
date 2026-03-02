-- Allow 'motus' as a provider for carrier_integrations (Motus mileage integration).
-- If the table was created without a provider column (e.g. different migration order), add it first.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'carrier_integrations'
      AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.carrier_integrations
      ADD COLUMN provider TEXT NOT NULL DEFAULT 'motive';
    CREATE INDEX IF NOT EXISTS idx_carrier_integrations_provider
      ON public.carrier_integrations(provider);
  END IF;
END $$;

ALTER TABLE public.carrier_integrations
  DROP CONSTRAINT IF EXISTS carrier_integrations_provider_check;

ALTER TABLE public.carrier_integrations
  ADD CONSTRAINT carrier_integrations_provider_check
  CHECK (provider IN ('samsara', 'motive', 'fmcsa', 'motus'));
