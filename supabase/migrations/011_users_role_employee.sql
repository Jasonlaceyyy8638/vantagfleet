-- Add EMPLOYEE to user_role enum for Admin Portal (CUSTOMER, EMPLOYEE, ADMIN).
-- If user_role or public.users don't exist (008 not run), create them first.

-- 1) Create user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'EMPLOYEE', 'ADMIN');
  END IF;
END $$;

-- 2) If user_role exists but doesn't have EMPLOYEE, add it (e.g. 008 created CUSTOMER, SUPPORT, ADMIN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'EMPLOYEE'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'EMPLOYEE';
  END IF;
END $$;

-- 3) Create public.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Trigger for updated_at (requires set_updated_at from 001; skip if missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS users_updated_at ON public.users;
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END $$;

COMMENT ON TABLE public.users IS 'One row per auth user. Role: CUSTOMER (default), EMPLOYEE, or ADMIN.';
COMMENT ON COLUMN public.users.role IS 'Platform role: CUSTOMER (default), EMPLOYEE, or ADMIN. Staff = ADMIN or EMPLOYEE.';
