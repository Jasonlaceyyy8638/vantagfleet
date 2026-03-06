-- Allow platform staff (Admin/Support) to create org_invites when impersonating a carrier.
-- Carriers: org members can create via user_org_ids(); staff: can create for any org when supporting.

DROP POLICY IF EXISTS "Org members can create invites" ON org_invites;
CREATE POLICY "Org members can create invites"
  ON org_invites FOR INSERT
  WITH CHECK (
    org_id IN (SELECT public.user_org_ids())
    OR EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = auth.uid())
  );
