-- First 5 Beta Testers: flag and trigger.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_beta_tester IS 'True for first 5 users (profile count < 5 at signup); bypasses Stripe paywall for IFTA/Vehicle add-ons.';

-- Update handle_new_user: set is_beta_tester = true when profile count before insert is < 5.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_count BIGINT;
  v_is_beta_tester BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles;
  v_is_beta_tester := (v_profile_count < 5);

  INSERT INTO public.profiles (id, user_id, org_id, role, full_name, is_beta_tester)
  VALUES (
    NEW.id,
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    v_is_beta_tester
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
