/* Audit trail for admin actions: refunds and organization changes. */

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  target_customer_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_employee_id ON public.admin_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_customer_id ON public.admin_logs(target_customer_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Inserts/reads from app use service role (createAdminClient). No policies needed for backend-only access.
COMMENT ON TABLE public.admin_logs IS 'Audit trail: employee actions (refunds, org create/update). Secure, append-only.';
