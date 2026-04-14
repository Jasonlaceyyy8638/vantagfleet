-- Vantag Control: internal ops (corporate admin allowlist). Access via service role from API routes.

-- Help / KB articles (published = published_at IS NOT NULL AND published_at <= now())
CREATE TABLE IF NOT EXISTS public.vantag_help_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vantag_help_resources_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_vantag_help_resources_published ON public.vantag_help_resources (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_vantag_help_resources_category ON public.vantag_help_resources (category);

-- Product announcements (in-app / email pipeline)
CREATE TABLE IF NOT EXISTS public.vantag_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  scheduled_at TIMESTAMPTZ,
  segment TEXT NOT NULL DEFAULT 'all' CHECK (segment IN ('all', 'trial', 'paid')),
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER,
  created_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vantag_announcements_status ON public.vantag_announcements (status, created_at DESC);

-- Stub: analytics events (opens/clicks) — optional charts later
CREATE TABLE IF NOT EXISTS public.vantag_announcement_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES public.vantag_announcements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vantag_announcement_events_ann ON public.vantag_announcement_events (announcement_id, created_at DESC);

-- Append-only audit for Vantag Control actions
CREATE TABLE IF NOT EXISTS public.vantag_control_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vantag_control_audit_created ON public.vantag_control_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vantag_control_audit_actor ON public.vantag_control_audit_log (actor_email);

ALTER TABLE public.vantag_help_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vantag_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vantag_announcement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vantag_control_audit_log ENABLE ROW LEVEL SECURITY;

-- Published help articles readable by anon + authenticated (marketing + in-app)
DROP POLICY IF EXISTS "vantag_help_resources_select_published" ON public.vantag_help_resources;
CREATE POLICY "vantag_help_resources_select_published"
  ON public.vantag_help_resources
  FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

COMMENT ON TABLE public.vantag_help_resources IS 'Marketing + in-app KB; writes via service role (Vantag Control).';
COMMENT ON TABLE public.vantag_announcements IS 'Product announcements; send pipeline from Vantag Control.';
COMMENT ON TABLE public.vantag_control_audit_log IS 'Append-only audit for corporate admin actions.';
