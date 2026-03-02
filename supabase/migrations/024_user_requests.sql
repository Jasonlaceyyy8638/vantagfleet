-- Custom compliance requests from dashboard (Integration, Report, or Alert).
CREATE TABLE IF NOT EXISTS public.user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Integration', 'Report', 'Alert')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewing', 'Building')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_requests_user_id ON public.user_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON public.user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_created_at ON public.user_requests(created_at DESC);

ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests.
CREATE POLICY "Users can insert own requests"
  ON public.user_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests (optional; admin reads via service role).
CREATE POLICY "Users can read own requests"
  ON public.user_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No update/delete by users; admin uses service role to update status.
COMMENT ON TABLE public.user_requests IS 'Custom compliance requests from dashboard FAB; shown in admin Product Roadmap.';
