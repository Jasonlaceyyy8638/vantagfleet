-- Include is_founder in welcome email webhook payload (Founder vs Standard welcome).
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
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'full_name', NEW.full_name,
      'is_beta_tester', COALESCE(NEW.is_beta_tester, false),
      'is_founder', COALESCE(NEW.is_founder, false)
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
