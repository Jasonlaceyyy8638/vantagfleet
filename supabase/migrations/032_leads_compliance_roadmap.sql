-- Lead capture for "Get Early Access" on landing page. Tracks email, DOT, and which feature they want (BOC-3, MCS-150, IFTA).
CREATE TABLE IF NOT EXISTS public.leads_compliance_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  dot_number TEXT,
  feature_interest TEXT NOT NULL CHECK (feature_interest IN ('boc3', 'mcs150', 'ifta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_compliance_roadmap_feature ON public.leads_compliance_roadmap(feature_interest);
CREATE INDEX IF NOT EXISTS idx_leads_compliance_roadmap_created_at ON public.leads_compliance_roadmap(created_at);

ALTER TABLE public.leads_compliance_roadmap ENABLE ROW LEVEL SECURITY;

-- Anonymous insert from landing page form.
CREATE POLICY "Anyone can submit compliance roadmap lead"
  ON public.leads_compliance_roadmap FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role reads (for Jason/admin).
CREATE POLICY "No public read compliance roadmap leads"
  ON public.leads_compliance_roadmap FOR SELECT
  TO authenticated
  USING (false);

COMMENT ON TABLE public.leads_compliance_roadmap IS 'Get Early Access signups: email, DOT number, and feature_interest (boc3, mcs150, ifta).';
