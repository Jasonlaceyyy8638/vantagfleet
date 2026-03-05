-- org_invites: add email for team invite flow (who to send invite to).
ALTER TABLE public.org_invites
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.org_invites.email IS 'Email address the invite was sent to (for display and optional email delivery).';

-- breakdown_incidents: incident/breakdown tracking for Roadside (dispatcher pins truck, status, etc.).
CREATE TABLE IF NOT EXISTS public.breakdown_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_label TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Repairing', 'Resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breakdown_incidents_org_id ON public.breakdown_incidents(org_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_incidents_status ON public.breakdown_incidents(status);
CREATE INDEX IF NOT EXISTS idx_breakdown_incidents_created_at ON public.breakdown_incidents(created_at DESC);

ALTER TABLE public.breakdown_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view breakdown_incidents"
  ON public.breakdown_incidents FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org members can insert breakdown_incidents"
  ON public.breakdown_incidents FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org members can update breakdown_incidents"
  ON public.breakdown_incidents FOR UPDATE
  USING (org_id IN (SELECT public.user_org_ids()))
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

COMMENT ON TABLE public.breakdown_incidents IS 'Roadside breakdown/incident log: dispatcher pins location, description, status (Pending/Repairing/Resolved).';
