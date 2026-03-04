-- Allow status 'verified' for user-approved IFTA receipts (audit-ready).
ALTER TABLE public.ifta_receipts
  DROP CONSTRAINT IF EXISTS ifta_receipts_status_check;

ALTER TABLE public.ifta_receipts
  ADD CONSTRAINT ifta_receipts_status_check
  CHECK (status IN ('pending', 'processed', 'verified'));

COMMENT ON COLUMN public.ifta_receipts.status IS 'pending = uploaded; processed = AI-extracted; verified = user approved for audit.';
