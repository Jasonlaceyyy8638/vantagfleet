-- Beta access expiry: optional date after which beta access is revoked.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.beta_expires_at IS 'When set, beta access is valid only when today < beta_expires_at. Null = no expiry (lifetime beta).';
