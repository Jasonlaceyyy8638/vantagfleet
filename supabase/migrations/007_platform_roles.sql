/* Platform roles for VantagFleet staff: ADMIN and EMPLOYEE. Used to gate admin routes. */

CREATE TABLE IF NOT EXISTS platform_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_roles_role ON platform_roles(role);

ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own platform role" ON platform_roles;
CREATE POLICY "Users can read own platform role"
  ON platform_roles FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE: use service role or run in SQL editor to add admins/employees.
COMMENT ON TABLE platform_roles IS 'Platform staff only. Add ADMIN/EMPLOYEE via Supabase SQL or service role.';
