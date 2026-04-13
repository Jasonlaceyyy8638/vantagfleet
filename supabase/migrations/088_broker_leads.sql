-- Broker pipeline: prospects before/during signup (needs, MC, lanes) — separate from FMCSA carrier `leads` (085).

CREATE TABLE IF NOT EXISTS public.broker_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  /** Broker authority (MC) number when known */
  broker_mc_number TEXT,
  /** Optional DOT if they operate under one */
  usdot_number TEXT,
  /** Rough volume signal for sales (free text, e.g. "50-100 loads/mo") */
  projected_monthly_loads TEXT,
  /** What they need: TMS, carrier vetting, margin, integrations, etc. */
  primary_needs TEXT,
  /** Structured extras: CRM, EDI, factoring, etc. */
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  /** Set when they become a real org in this product */
  converted_org_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_leads_created_at ON public.broker_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broker_leads_email ON public.broker_leads (email);
CREATE INDEX IF NOT EXISTS idx_broker_leads_status ON public.broker_leads (status);
CREATE INDEX IF NOT EXISTS idx_broker_leads_converted_org ON public.broker_leads (converted_org_id) WHERE converted_org_id IS NOT NULL;

COMMENT ON TABLE public.broker_leads IS 'Inbound broker prospects: contact, MC/DOT, volume, and needs—distinct from public.leads (FMCSA carrier census).';

ALTER TABLE public.broker_leads ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS broker_leads_updated_at ON public.broker_leads;
CREATE TRIGGER broker_leads_updated_at
  BEFORE UPDATE ON public.broker_leads
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Anonymous landing / contact forms (same pattern as early_access_leads).
CREATE POLICY "Anyone can submit broker lead"
  ON public.broker_leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can submit broker lead"
  ON public.broker_leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No in-app read for normal users; staff use service role or future admin policy.
CREATE POLICY "No public read broker leads"
  ON public.broker_leads FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "no_anon_read_broker_leads"
  ON public.broker_leads FOR SELECT
  TO anon
  USING (false);
