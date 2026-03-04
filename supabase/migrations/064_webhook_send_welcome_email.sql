-- Database webhook: trigger send-welcome-email Edge Function when a new profile is inserted.
-- Requires: pg_net extension (enable in Dashboard → Database → Extensions if needed).
-- Before running: replace YOUR_PROJECT_REF with your Supabase project reference (Dashboard → Settings → API → Project URL, e.g. https://abcdefgh.supabase.co → use "abcdefgh").
-- Set Edge Function secrets: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, and ensure SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are available to the function.

-- Enable pg_net (Dashboard → Database → Extensions if not already enabled).
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-welcome-email';
  request_id bigint;
  payload jsonb;
BEGIN
  -- Build payload: record with fields the Edge Function expects (user_id, full_name, is_beta_tester).
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'full_name', NEW.full_name,
      'is_beta_tester', COALESCE(NEW.is_beta_tester, false)
    )
  );

  SELECT net.http_post(
    url := edge_function_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  ) INTO request_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_send_welcome_email() IS 'Calls send-welcome-email Edge Function on profile insert; replace YOUR_PROJECT_REF in the function body with your project ref.';

DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_welcome_email();
