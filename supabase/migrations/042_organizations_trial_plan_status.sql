-- Subscription and trial state for Stripe webhook updates.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_active BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan_level TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

COMMENT ON COLUMN public.organizations.trial_active IS 'True while subscription is in trial (e.g. 30-day); set by Stripe webhook.';
COMMENT ON COLUMN public.organizations.plan_level IS 'Derived from subscription: free, solo, pro. Set to free when subscription deleted.';
COMMENT ON COLUMN public.organizations.subscription_status IS 'trialing | active_paid | canceled; set by Stripe webhooks.';
