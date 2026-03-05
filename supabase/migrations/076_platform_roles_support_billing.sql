-- VantagFleet staff roles: Admin (full), Support (full + carrier impersonation), Billing (billing only).
-- Allow SUPPORT and BILLING in platform_roles so they can access /admin with appropriate permissions.

ALTER TABLE public.platform_roles
  DROP CONSTRAINT IF EXISTS platform_roles_role_check;

ALTER TABLE public.platform_roles
  ADD CONSTRAINT platform_roles_role_check
  CHECK (role IN ('ADMIN', 'EMPLOYEE', 'super-admin', 'SUPPORT', 'BILLING'));

COMMENT ON TABLE public.platform_roles IS 'Platform staff. super-admin/ADMIN = full; SUPPORT = full + impersonate carrier; BILLING = billing/revenue only.';

-- Add Billing to vantag_staff_role if not present (display roles on Team page).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'vantag_staff_role' AND e.enumlabel = 'Billing'
  ) THEN
    ALTER TYPE vantag_staff_role ADD VALUE 'Billing';
  END IF;
END
$$;

-- Ensure we have Admin, Support, Billing (Sales, Manager may already exist from 014).
COMMENT ON TYPE vantag_staff_role IS 'VantagFleet team display roles: Admin, Billing, Support (+ legacy Sales, Manager).';
