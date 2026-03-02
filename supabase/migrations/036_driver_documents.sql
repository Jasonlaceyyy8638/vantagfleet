-- New Hire Documents: per-driver document storage with AI-identified type and expiry.
DO $$ BEGIN
  CREATE TYPE driver_document_type AS ENUM (
    'COI',
    'REGISTRATION',
    'IFTA',
    'MCS150',
    'BOC3',
    'MED_CARD',
    'CDL',
    'MVR',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  document_type driver_document_type NOT NULL,
  file_url TEXT NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON public.driver_documents(driver_id, document_type);

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage driver_documents for drivers in their org"
  ON public.driver_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers d
      WHERE d.id = driver_documents.driver_id
      AND d.org_id IN (
        SELECT org_id FROM profiles WHERE user_id = auth.uid()
        UNION
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers d
      WHERE d.id = driver_documents.driver_id
      AND d.org_id IN (
        SELECT org_id FROM profiles WHERE user_id = auth.uid()
        UNION
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.driver_documents IS 'New Hire / carrier documents: COI, IFTA, registration, etc. AI-identified type and extracted expiry.';
