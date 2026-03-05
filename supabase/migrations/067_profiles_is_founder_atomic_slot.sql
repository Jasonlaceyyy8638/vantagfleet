-- Limited Founder Access: is_founder + atomic slot so only first 5 get founder benefits.
-- Counter is atomic via sequence; cap trigger prevents manual override.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_founder IS 'True for first 5 signups (Founding Carriers); 90-day credit, founder welcome email, badge. Set atomically via founder_slot_seq.';

-- Sequence: one value per signup; slot 1-5 = founder, 6+ = standard. Atomic.
CREATE SEQUENCE IF NOT EXISTS public.founder_slot_seq START WITH 1;

COMMENT ON SEQUENCE public.founder_slot_seq IS 'Atomic counter for founder slots; nextval in handle_new_user ensures only 5 get is_founder.';

-- handle_new_user: use sequence for atomic founder assignment; first 5 get is_founder + 90-day credit.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot BIGINT;
  v_is_founder BOOLEAN;
  v_beta_expires_at TIMESTAMPTZ;
BEGIN
  v_slot := nextval('public.founder_slot_seq');
  v_is_founder := (v_slot <= 5);
  v_beta_expires_at := CASE WHEN v_is_founder THEN (NOW() + INTERVAL '90 days') ELSE NULL END;

  INSERT INTO public.profiles (id, user_id, org_id, role, full_name, is_beta_tester, ifta_enabled, beta_expires_at, is_founder)
  VALUES (
    NEW.id,
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    v_is_founder,
    v_is_founder,
    v_beta_expires_at,
    v_is_founder
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, role)
  VALUES (NEW.id, 'CUSTOMER'::user_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'handle_new_user: %', SQLERRM;
END;
$$;

-- Enforce max 5 founders (block manual UPDATE that would set is_founder = true when 5 already exist).
CREATE OR REPLACE FUNCTION public.check_founder_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_founder_count BIGINT;
BEGIN
  IF NEW.is_founder IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_current_founder_count FROM public.profiles WHERE is_founder = true;
  ELSE
    SELECT COUNT(*) INTO v_current_founder_count FROM public.profiles WHERE is_founder = true AND id <> OLD.id;
  END IF;

  IF v_current_founder_count >= 5 THEN
    RAISE EXCEPTION 'Founder limit reached: maximum 5 allowed. Cannot set is_founder = true.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_founder_cap ON public.profiles;
CREATE TRIGGER enforce_founder_cap
  BEFORE INSERT OR UPDATE OF is_founder
  ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_founder_cap();
