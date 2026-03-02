-- Lead capture for "Get Early Access" on landing page (BOC-3, MCS-150, IFTA).
CREATE TABLE IF NOT EXISTS public.early_access_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  dot_number TEXT,
  feature TEXT NOT NULL CHECK (feature IN ('boc3', 'mcs150', 'ifta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_early_access_leads_feature ON public.early_access_leads(feature);
CREATE INDEX IF NOT EXISTS idx_early_access_leads_created_at ON public.early_access_leads(created_at);

ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (public landing form).
CREATE POLICY "Anyone can submit early access lead"
  ON public.early_access_leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role can read (admin/Jason).
CREATE POLICY "No public read early access leads"
  ON public.early_access_leads FOR SELECT
  TO authenticated
  USING (false);

COMMENT ON TABLE public.early_access_leads IS 'Get Early Access signups from landing page Future of Compliance section.';
