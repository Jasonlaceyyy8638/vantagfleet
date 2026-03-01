/* User-level role enum and users table. Default CUSTOMER; SUPPORT/ADMIN for staff. */

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'SUPPORT', 'ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE public.users IS 'One row per auth user. Role: CUSTOMER (default), SUPPORT, or ADMIN.';
COMMENT ON COLUMN public.users.role IS 'Platform role. CUSTOMER = default; SUPPORT/ADMIN = staff.';
