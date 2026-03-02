-- AI-scanned driver qualification docs: expiration, issue date, driver name from Med Card, CDL, MVR.
CREATE TABLE IF NOT EXISTS public.driver_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('med_card', 'cdl', 'mvr')),
  expiration_date DATE,
  issue_date DATE,
  driver_name TEXT,
  alert_status TEXT CHECK (alert_status IN ('green', 'amber', 'red')),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_driver_qualifications_driver_id ON public.driver_qualifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_qualifications_expiration ON public.driver_qualifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_driver_qualifications_alert_status ON public.driver_qualifications(alert_status);

ALTER TABLE public.driver_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage qualifications for drivers in their org"
  ON public.driver_qualifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drivers d
      WHERE d.id = driver_qualifications.driver_id
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
      WHERE d.id = driver_qualifications.driver_id
      AND d.org_id IN (
        SELECT org_id FROM profiles WHERE user_id = auth.uid()
        UNION
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.driver_qualifications IS 'AI-scanned DQ docs: expiration_date, issue_date, driver_name. Used for early warning (amber/red).';
