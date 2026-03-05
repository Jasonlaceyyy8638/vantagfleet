-- Driver daily log signature: drawn on Roadside tab, watermarked onto PDFs sent to officer.
CREATE TABLE IF NOT EXISTS public.driver_daily_log_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, signature_date)
);

CREATE INDEX IF NOT EXISTS idx_driver_daily_log_signatures_org_user_date
  ON public.driver_daily_log_signatures(org_id, user_id, signature_date DESC);

ALTER TABLE public.driver_daily_log_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own signature"
  ON public.driver_daily_log_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id AND org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can view own org signatures"
  ON public.driver_daily_log_signatures FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Users can update own signature"
  ON public.driver_daily_log_signatures FOR UPDATE
  USING (auth.uid() = user_id AND org_id IN (SELECT public.user_org_ids()))
  WITH CHECK (auth.uid() = user_id AND org_id IN (SELECT public.user_org_ids()));

COMMENT ON TABLE public.driver_daily_log_signatures IS 'Driver signature for daily log; watermarked onto compliance PDFs sent to officer.';
