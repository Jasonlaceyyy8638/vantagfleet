-- Lead capture for "Join the Compliance Alpha" modal (The Future of VantagFleet section).
CREATE TABLE IF NOT EXISTS public.roadmap_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  dot_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_leads_created_at ON public.roadmap_leads(created_at);

ALTER TABLE public.roadmap_leads ENABLE ROW LEVEL SECURITY;

-- Anonymous insert from landing page.
CREATE POLICY "Anyone can submit roadmap lead"
  ON public.roadmap_leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role reads.
CREATE POLICY "No public read roadmap leads"
  ON public.roadmap_leads FOR SELECT
  TO authenticated
  USING (false);

COMMENT ON TABLE public.roadmap_leads IS 'Join the Compliance Alpha signups from The Future of VantagFleet section.';
