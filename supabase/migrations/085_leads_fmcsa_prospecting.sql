-- Prospecting leads (e.g. FMCSA Company Census extract). Deduplicate by USDOT number.
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dot_number text NOT NULL,
  legal_name text NOT NULL,
  email text,
  power_units integer,
  carrier_status text,
  source text NOT NULL DEFAULT 'fmcsa_company_census',
  extra jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_dot_number_key UNIQUE (dot_number)
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_power_units ON public.leads (power_units);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email) WHERE email IS NOT NULL;

COMMENT ON TABLE public.leads IS 'Sales/prospecting leads; FMCSA census rows keyed by dot_number. Inserts use service role or policies you add for staff.';

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Intended for ingestion via service role (bypasses RLS). Add explicit policies if staff need read access in-app.

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
