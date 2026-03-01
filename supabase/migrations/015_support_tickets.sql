-- Support tickets from contact form. Staff can view, set status, and reply.

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reply_text TEXT,
  replied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Only staff (platform_roles) can read/update. Inserts from anonymous or authenticated via service role / API.
DROP POLICY IF EXISTS "Staff can read support_tickets" ON public.support_tickets;
CREATE POLICY "Staff can read support_tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff can update support_tickets" ON public.support_tickets;
CREATE POLICY "Staff can update support_tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.platform_roles WHERE user_id = auth.uid())
  );

-- Insert: allow authenticated and anon (contact form); use service role in action to bypass if needed
DROP POLICY IF EXISTS "Allow insert support_tickets" ON public.support_tickets;
CREATE POLICY "Allow insert support_tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.support_tickets IS 'Contact support form submissions; staff manage via Admin Team Support Inbox.';
