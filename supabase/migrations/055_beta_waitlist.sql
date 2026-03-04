-- Beta waitlist: when beta spots reach 5, new visitors can join waitlist instead of signing up.
CREATE TABLE IF NOT EXISTS public.beta_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_waitlist_email ON public.beta_waitlist (LOWER(email));
COMMENT ON TABLE public.beta_waitlist IS 'Emails collected when beta spots are full; used for Join Waitlist on landing.';

-- Allow anonymous inserts (public form); no RLS or restrict to anon if needed.
ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (join waitlist); only service role can read.
CREATE POLICY "Allow insert for waitlist signup"
  ON public.beta_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(trim(email)) > 0);

-- No SELECT for anon/authenticated so we don't expose the list; admin uses service role.
CREATE POLICY "Service role can read waitlist"
  ON public.beta_waitlist FOR SELECT
  TO service_role
  USING (true);
