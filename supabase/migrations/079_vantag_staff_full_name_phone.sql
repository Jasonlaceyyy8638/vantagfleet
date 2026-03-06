-- VantagFleet staff: store full name and phone (required when adding).
ALTER TABLE public.vantag_staff
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.vantag_staff.full_name IS 'Display name for the staff member.';
COMMENT ON COLUMN public.vantag_staff.phone IS 'Phone number for the staff member.';
