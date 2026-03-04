-- profiles.subscription_status: trialing | active | canceled (synced from org or set by Stripe).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

COMMENT ON COLUMN public.profiles.subscription_status IS 'trialing | active | canceled; full access when active.';

-- Backfill: existing beta testers get beta_expires_at = 90 days from now (if null).
-- Uses NOW() so we don't depend on profiles.created_at (column may not exist in all projects).
UPDATE public.profiles
SET beta_expires_at = NOW() + INTERVAL '90 days'
WHERE is_beta_tester = true AND beta_expires_at IS NULL;

-- Beta testers get beta_expires_at = created_at + 90 days.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_count BIGINT;
  v_is_beta_tester BOOLEAN;
  v_beta_expires_at TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles;
  v_is_beta_tester := (v_profile_count < 5);
  v_beta_expires_at := CASE WHEN v_is_beta_tester THEN (NOW() + INTERVAL '90 days') ELSE NULL END;

  INSERT INTO public.profiles (id, user_id, org_id, role, full_name, is_beta_tester, ifta_enabled, beta_expires_at)
  VALUES (
    NEW.id,
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    v_is_beta_tester,
    v_is_beta_tester,
    v_beta_expires_at
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
