-- Enforce max 5 beta testers: block INSERT/UPDATE that would set is_beta_tester = true when 5 already exist.
CREATE OR REPLACE FUNCTION public.check_beta_tester_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_beta_count BIGINT;
BEGIN
  -- Only enforce when the row would have is_beta_tester = true
  IF NEW.is_beta_tester IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_current_beta_count FROM public.profiles WHERE is_beta_tester = true;
  ELSE
    -- UPDATE: count other rows with is_beta_tester = true (excluding this row)
    SELECT COUNT(*) INTO v_current_beta_count FROM public.profiles WHERE is_beta_tester = true AND id <> OLD.id;
  END IF;

  IF v_current_beta_count >= 5 THEN
    RAISE EXCEPTION 'Beta tester limit reached: maximum 5 allowed. Cannot set is_beta_tester = true.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_beta_tester_cap() IS 'Trigger: prevents is_beta_tester = true when 5 profiles already have it.';

DROP TRIGGER IF EXISTS enforce_beta_tester_cap ON public.profiles;
CREATE TRIGGER enforce_beta_tester_cap
  BEFORE INSERT OR UPDATE OF is_beta_tester
  ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_beta_tester_cap();
