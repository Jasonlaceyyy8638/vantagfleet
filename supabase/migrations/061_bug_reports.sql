-- Beta feedback: store bug reports with optional screenshot for tracking.
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  task_name TEXT,
  description TEXT NOT NULL,
  device TEXT,
  action TEXT,
  screenshot_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_org_id ON public.bug_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);

COMMENT ON TABLE public.bug_reports IS 'Beta tester bug reports from /dashboard/feedback; screenshot stored in storage.';

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own org bug reports"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (org_id IS NULL OR org_id IN (SELECT public.user_org_ids()))
  );

CREATE POLICY "Users can read own org bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR org_id IN (SELECT public.user_org_ids())
  );
