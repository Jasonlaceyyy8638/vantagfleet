-- Ensure every new auth user gets a row in public.users with role CUSTOMER (for Admin Portal role checks).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, org_id, role, full_name)
  VALUES (
    uuid_generate_v4(),
    NEW.id,
    NULL,
    'Driver'::app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );

  INSERT INTO public.users (id, role)
  VALUES (NEW.id, 'CUSTOMER'::user_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'handle_new_user: %', SQLERRM;
END;
$$;
