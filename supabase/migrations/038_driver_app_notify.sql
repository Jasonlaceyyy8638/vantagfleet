-- Waitlist for "Notify Me" on the Driver App Coming Soon section (landing page).
CREATE TABLE IF NOT EXISTS public.driver_app_notify (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_app_notify_created_at ON public.driver_app_notify(created_at);

ALTER TABLE public.driver_app_notify ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit driver app notify"
  ON public.driver_app_notify FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role reads (no public read).
CREATE POLICY "No public read driver_app_notify"
  ON public.driver_app_notify FOR SELECT
  TO authenticated
  USING (false);

COMMENT ON TABLE public.driver_app_notify IS 'Notify Me signups for VantagFleet Driver App (Coming Soon section).';
