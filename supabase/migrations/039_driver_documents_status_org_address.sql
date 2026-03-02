-- driver_documents: status for filtering 'Approved' docs in compliance report.
ALTER TABLE public.driver_documents
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

COMMENT ON COLUMN public.driver_documents.status IS 'Document status e.g. approved, pending. Used for official compliance report.';

-- organizations: optional address for compliance report.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN public.organizations.address IS 'Carrier address for compliance report and correspondence.';
