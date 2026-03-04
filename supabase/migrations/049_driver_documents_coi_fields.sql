-- COI-specific fields: liability/cargo limits and non-compliant flag. Status may be 'expired'.
ALTER TABLE public.driver_documents
  ADD COLUMN IF NOT EXISTS liability_limit NUMERIC,
  ADD COLUMN IF NOT EXISTS cargo_limit NUMERIC,
  ADD COLUMN IF NOT EXISTS non_compliant BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.driver_documents.liability_limit IS 'Liability limit in USD from COI scan; used to flag non-compliance if < $1,000,000.';
COMMENT ON COLUMN public.driver_documents.cargo_limit IS 'Cargo limit in USD from COI scan.';
COMMENT ON COLUMN public.driver_documents.non_compliant IS 'True when COI liability limit is below $1,000,000.';
