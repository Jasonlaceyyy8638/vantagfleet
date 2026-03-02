-- Compliance scanner: flag driver for review after AI scan.
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS compliance_status TEXT;

COMMENT ON COLUMN public.drivers.compliance_status IS 'Set by Compliance Scanner e.g. REVIEW_REQUIRED after AI document scan.';
