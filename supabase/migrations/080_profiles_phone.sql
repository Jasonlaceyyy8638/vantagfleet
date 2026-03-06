-- Phone number for carrier team members (e.g. when added by owner).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'Phone number for the team member.';
