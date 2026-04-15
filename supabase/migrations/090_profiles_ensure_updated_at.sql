-- Fix: assign user to org (profiles UPDATE) fails with
--   record "new" has no field "updated_at"
-- when public.profiles exists without updated_at (e.g. Supabase template table
-- created before 001 ran, so CREATE TABLE IF NOT EXISTS skipped the full schema)
-- while profiles_updated_at still calls set_updated_at().

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.profiles SET updated_at = now() WHERE updated_at IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET NOT NULL;

-- Ensure trigger only runs on UPDATE (repair accidental BEFORE INSERT definitions).
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
