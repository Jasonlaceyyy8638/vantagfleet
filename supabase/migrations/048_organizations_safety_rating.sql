-- FMCSA safety rating on organization (auto-populated from FMCSA carrier lookup).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS safety_rating TEXT;

COMMENT ON COLUMN public.organizations.safety_rating IS 'FMCSA safety rating: Satisfactory, Conditional, Unsatisfactory, or None. Fetched from mobile.fmcsa.dot.gov.';
