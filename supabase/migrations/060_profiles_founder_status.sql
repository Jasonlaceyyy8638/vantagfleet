-- Founder status: beta testers who complete checkout become founders (lifetime 20% discount).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founder_status BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.founder_status IS 'True when user completed founder checkout; identifies them for lifetime 20% discount. Set on /dashboard/success.';
