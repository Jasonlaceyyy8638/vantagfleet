-- Real-time support chat between carriers and admin.
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_org_id ON public.support_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_messages_receiver_id ON public.support_messages(receiver_id) WHERE receiver_id IS NOT NULL;

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Carriers: can insert as sender when they belong to the org; can select messages for their orgs.
CREATE POLICY "Carriers can insert own messages for their org"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND org_id IN (
      SELECT org_id FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL
    )
  );

CREATE POLICY "Carriers can read messages for their orgs"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE user_id = auth.uid() AND org_id IS NOT NULL
    )
  );

-- Admin: use service role for admin UI (bypass RLS). No policy for platform_roles needed if admin uses createAdminClient().
-- Realtime: include table in publication and set replica identity so payload includes row data.
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

COMMENT ON TABLE public.support_messages IS 'Real-time support chat; carrier sends with receiver_id NULL; admin replies with receiver_id = carrier user.';
