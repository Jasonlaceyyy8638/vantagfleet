-- Log "Notify Me" interest for coming-soon integrations (Geotab, Samsara).
CREATE TABLE IF NOT EXISTS public.integration_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('geotab', 'samsara')),
  email TEXT NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_wishlist_provider ON public.integration_wishlist(provider);
CREATE INDEX IF NOT EXISTS idx_integration_wishlist_created_at ON public.integration_wishlist(created_at);

ALTER TABLE public.integration_wishlist ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert (when they click Notify Me).
CREATE POLICY "Authenticated users can add wishlist entry"
  ON public.integration_wishlist FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only service role / admin reads (admin dashboard).
CREATE POLICY "No public read"
  ON public.integration_wishlist FOR SELECT
  TO authenticated
  USING (false);

COMMENT ON TABLE public.integration_wishlist IS 'Notify Me signups for Geotab and Samsara integrations; used for admin wishlist chart.';
