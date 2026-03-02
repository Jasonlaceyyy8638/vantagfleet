-- Allow 'super-admin' role: only super-admins can access /admin/** (middleware).
-- To grant access, set role = 'super-admin' for the user in platform_roles (e.g. UPDATE platform_roles SET role = 'super-admin' WHERE user_id = 'your-user-uuid').
ALTER TABLE public.platform_roles
  DROP CONSTRAINT IF EXISTS platform_roles_role_check;

ALTER TABLE public.platform_roles
  ADD CONSTRAINT platform_roles_role_check
  CHECK (role IN ('ADMIN', 'EMPLOYEE', 'super-admin'));

COMMENT ON TABLE public.platform_roles IS 'Platform staff. super-admin = full /admin access + impersonation; ADMIN/EMPLOYEE = legacy.';
