-- Waitlist for Compliance Power-Ups (MCS-150, BOC-3). Jason can see demand in admin.
CREATE TABLE IF NOT EXISTS public.compliance_powerup_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  powerup_type TEXT NOT NULL CHECK (powerup_type IN ('mcs150', 'boc3')),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, powerup_type)
);

CREATE INDEX IF NOT EXISTS idx_compliance_powerup_waitlist_powerup_type ON public.compliance_powerup_waitlist(powerup_type);
CREATE INDEX IF NOT EXISTS idx_compliance_powerup_waitlist_created_at ON public.compliance_powerup_waitlist(created_at);

ALTER TABLE public.compliance_powerup_waitlist ENABLE ROW LEVEL SECURITY;

-- Authenticated users can add themselves to the waitlist.
CREATE POLICY "Authenticated users can add powerup waitlist entry"
  ON public.compliance_powerup_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only service role / admin reads (for Jason to see demand).
CREATE POLICY "No public read powerup waitlist"
  ON public.compliance_powerup_waitlist FOR SELECT
  TO authenticated
  USING (false);

COMMENT ON TABLE public.compliance_powerup_waitlist IS 'Join Waitlist signups for MCS-150 and BOC-3 Compliance Power-Ups; admin can view demand.';
