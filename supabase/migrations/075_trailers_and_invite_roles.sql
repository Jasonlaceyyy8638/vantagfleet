-- Trailers table: org-owned trailers, assignable to drivers.
CREATE TABLE IF NOT EXISTS public.trailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trailer_number TEXT NOT NULL,
  vin TEXT,
  assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trailers_org_id ON public.trailers(org_id);
CREATE INDEX IF NOT EXISTS idx_trailers_assigned_driver_id ON public.trailers(assigned_driver_id);

ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view trailers"
  ON public.trailers FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Managers can insert trailers"
  ON public.trailers FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = org_id
      AND p.role IN ('Owner', 'Safety_Manager', 'Driver_Manager', 'Dispatcher')
    )
  );

CREATE POLICY "Managers can update trailers"
  ON public.trailers FOR UPDATE
  USING (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = trailers.org_id
      AND p.role IN ('Owner', 'Safety_Manager', 'Driver_Manager', 'Dispatcher')
    )
  );

CREATE POLICY "Managers can delete trailers"
  ON public.trailers FOR DELETE
  USING (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = trailers.org_id
      AND p.role IN ('Owner', 'Safety_Manager', 'Driver_Manager', 'Dispatcher')
    )
  );

COMMENT ON TABLE public.trailers IS 'Org trailers; assigned_driver_id links to driver for Roadside view.';

CREATE TRIGGER trailers_updated_at
  BEFORE UPDATE ON public.trailers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Allow Safety_Manager and Driver_Manager as invite roles.
ALTER TABLE public.org_invites
  DROP CONSTRAINT IF EXISTS org_invites_invite_role_check;

ALTER TABLE public.org_invites
  ADD CONSTRAINT org_invites_invite_role_check
  CHECK (invite_role IN ('Driver', 'Dispatcher', 'Safety_Manager', 'Driver_Manager'));

COMMENT ON COLUMN public.org_invites.invite_role IS 'Role when accepted: Driver, Dispatcher, Safety_Manager, or Driver_Manager.';
