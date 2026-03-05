-- Driver-reported roadside incidents (inspection, breakdown, accident, citation).
-- Linked to driver/org; photo stored in storage; dispatchers notified.
CREATE TABLE IF NOT EXISTS public.roadside_incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reported_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('DOT Inspection', 'Mechanical Breakdown', 'Accident', 'Citation')),
  photo_path TEXT,
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadside_incident_reports_org_id ON public.roadside_incident_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_roadside_incident_reports_reported_by ON public.roadside_incident_reports(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_roadside_incident_reports_created_at ON public.roadside_incident_reports(created_at DESC);

ALTER TABLE public.roadside_incident_reports ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own reports (must belong to org).
CREATE POLICY "Users can insert own org incident reports"
  ON public.roadside_incident_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reported_by_user_id
    AND org_id IN (SELECT public.user_org_ids())
  );

-- Users can view incident reports for their org.
CREATE POLICY "Org members can view incident reports"
  ON public.roadside_incident_reports FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

COMMENT ON TABLE public.roadside_incident_reports IS 'Driver-submitted roadside reports: inspection, breakdown, accident, citation; photo + GPS; dispatcher alert.';
