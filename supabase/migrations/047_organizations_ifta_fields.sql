-- Optional IFTA return fields for PDF header (Legal Name, FEIN, IFTA Account Number).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS fein TEXT,
  ADD COLUMN IF NOT EXISTS ifta_account_number TEXT;

COMMENT ON COLUMN public.organizations.legal_name IS 'Legal business name for IFTA/filings (defaults to name if null).';
COMMENT ON COLUMN public.organizations.fein IS 'Federal EIN for IFTA return header.';
COMMENT ON COLUMN public.organizations.ifta_account_number IS 'IFTA account number for return header.';
