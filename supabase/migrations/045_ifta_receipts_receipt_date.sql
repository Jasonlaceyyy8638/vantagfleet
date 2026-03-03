-- Optional: store extracted receipt date from AI scan.
ALTER TABLE public.ifta_receipts
  ADD COLUMN IF NOT EXISTS receipt_date DATE;

COMMENT ON COLUMN public.ifta_receipts.receipt_date IS 'Extracted from receipt image by AI; used for IFTA reporting.';
