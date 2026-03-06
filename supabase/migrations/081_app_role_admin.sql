-- Add Admin role for carrier org (e.g. terminal manager). Same dashboard access as Owner but assignable when adding team members.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'Admin'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'Admin';
  END IF;
END $$;

COMMENT ON TYPE app_role IS 'Owner = org owner; Admin = terminal manager / full access; Safety_Manager = compliance; Driver_Manager = drivers/trailers; Driver = driver app; Dispatcher = limited (Enterprise).';

-- Allow Admin in trailer policies (same as Owner).
DROP POLICY IF EXISTS "Managers can insert trailers" ON public.trailers;
CREATE POLICY "Managers can insert trailers"
  ON public.trailers FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = org_id
      AND p.role IN ('Owner', 'Admin', 'Safety_Manager', 'Driver_Manager', 'Dispatcher')
    )
  );

DROP POLICY IF EXISTS "Managers can update trailers" ON public.trailers;
CREATE POLICY "Managers can update trailers"
  ON public.trailers FOR UPDATE
  USING (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = trailers.org_id
      AND p.role IN ('Owner', 'Admin', 'Safety_Manager', 'Driver_Manager', 'Dispatcher')
    )
  );

DROP POLICY IF EXISTS "Managers can delete trailers" ON public.trailers;
CREATE POLICY "Managers can delete trailers"
  ON public.trailers FOR DELETE
  USING (
    org_id IN (SELECT public.user_org_ids())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.org_id = trailers.org_id
      AND p.role IN ('Owner', 'Admin', 'Safety_Manager', 'Driver_Manager', 'Dispatcher')
    )
  );
