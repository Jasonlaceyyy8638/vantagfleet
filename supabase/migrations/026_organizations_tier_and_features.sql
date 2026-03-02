-- Tier and feature flags per organization. Diamond tier unlocks Predictive Audit AI and Advanced Route History; admin can toggle any feature per customer.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'starter';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.organizations.tier IS 'Subscription tier: starter, pro, or Diamond. Diamond unlocks premium feature placeholders.';
COMMENT ON COLUMN public.organizations.features IS 'Array of feature keys (e.g. predictive_audit_ai, advanced_route_history). Admin can toggle per org.';
