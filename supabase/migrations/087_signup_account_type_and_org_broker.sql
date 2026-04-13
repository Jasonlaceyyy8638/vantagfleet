/* Signup: carrier vs broker — organizations.business_type / mc_number; profiles.account_type; onboarding timestamp. */

-- -----------------------------------------------------------------------------
-- organizations: broker MC + business type
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mc_number TEXT;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS business_type TEXT;

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_business_type_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_business_type_check
  CHECK (business_type IS NULL OR business_type IN ('carrier', 'broker'));

COMMENT ON COLUMN public.organizations.business_type IS 'carrier = asset carrier; broker = freight broker / 3PL.';
COMMENT ON COLUMN public.organizations.mc_number IS 'Broker MC number when business_type = broker.';

DROP INDEX IF EXISTS idx_organizations_mc_number_unique;
CREATE UNIQUE INDEX idx_organizations_mc_number_unique
  ON public.organizations(mc_number)
  WHERE mc_number IS NOT NULL;

-- -----------------------------------------------------------------------------
-- profiles: account type + onboarding completed
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IS NULL OR account_type IN ('carrier', 'broker'));

COMMENT ON COLUMN public.profiles.account_type IS 'carrier vs broker from signup (auth user_role metadata); default landing.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Set when org_id is first linked (signup onboarding).';

-- -----------------------------------------------------------------------------
-- Auth trigger: copy user_role from raw_user_meta_data into profiles.account_type
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'user_role', '')));
  IF v_role NOT IN ('carrier', 'broker') THEN
    v_role := NULL;
  END IF;

  INSERT INTO public.profiles (id, user_id, org_id, role, full_name, account_type)
  VALUES (
    NEW.id,
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    v_role
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

-- -----------------------------------------------------------------------------
-- BEFORE INSERT/UPDATE: when org_id is set, sync account_type from auth metadata if missing; stamp onboarding_completed_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_profile_onboarding_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.org_id IS NULL THEN
    RETURN NEW;
  END IF;
  -- Only first-time link to an org (signup onboarding), not org changes.
  IF TG_OP = 'UPDATE' AND OLD.org_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.account_type IS NULL THEN
    SELECT NULLIF(LOWER(TRIM(COALESCE(raw_user_meta_data->>'user_role', ''))), '')
    INTO v_role
    FROM auth.users
    WHERE id = NEW.user_id;
    IF v_role IN ('carrier', 'broker') THEN
      NEW.account_type := v_role;
    END IF;
  END IF;

  IF NEW.onboarding_completed_at IS NULL THEN
    NEW.onboarding_completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_onboarding_completed ON public.profiles;
CREATE TRIGGER trg_profiles_onboarding_completed
  BEFORE INSERT OR UPDATE OF org_id ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_profile_onboarding_completed();
