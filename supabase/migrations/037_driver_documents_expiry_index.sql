-- Index for expiry alert cron: query driver_documents by expiry_date (30, 15, 5 days out).
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry_date
  ON public.driver_documents(expiry_date)
  WHERE expiry_date IS NOT NULL;
