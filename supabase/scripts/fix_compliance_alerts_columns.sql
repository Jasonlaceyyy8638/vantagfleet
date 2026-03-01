-- Fix compliance_alerts if it was created without org_id (and other columns).
-- Run this in Supabase SQL Editor if you see: column "org_id" does not exist.

-- Add missing columns if they don't exist (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'compliance_alerts' AND column_name = 'org_id') THEN
    ALTER TABLE public.compliance_alerts ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    UPDATE public.compliance_alerts SET org_id = (SELECT id FROM public.organizations LIMIT 1) WHERE org_id IS NULL;
    ALTER TABLE public.compliance_alerts ALTER COLUMN org_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'compliance_alerts' AND column_name = 'alert_type') THEN
    ALTER TABLE public.compliance_alerts ADD COLUMN alert_type TEXT CHECK (alert_type IN ('expired_cdl', 'missing_inspection'));
    UPDATE public.compliance_alerts SET alert_type = 'expired_cdl' WHERE alert_type IS NULL;
    ALTER TABLE public.compliance_alerts ALTER COLUMN alert_type SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'compliance_alerts' AND column_name = 'entity_type') THEN
    ALTER TABLE public.compliance_alerts ADD COLUMN entity_type TEXT CHECK (entity_type IN ('driver', 'vehicle'));
    UPDATE public.compliance_alerts SET entity_type = 'driver' WHERE entity_type IS NULL;
    ALTER TABLE public.compliance_alerts ALTER COLUMN entity_type SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'compliance_alerts' AND column_name = 'entity_id') THEN
    ALTER TABLE public.compliance_alerts ADD COLUMN entity_id UUID;
    UPDATE public.compliance_alerts SET entity_id = gen_random_uuid() WHERE entity_id IS NULL;
    ALTER TABLE public.compliance_alerts ALTER COLUMN entity_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'compliance_alerts' AND column_name = 'message') THEN
    ALTER TABLE public.compliance_alerts ADD COLUMN message TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.compliance_alerts ALTER COLUMN message DROP DEFAULT;
  END IF;
END$$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_org_id ON public.compliance_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_created_at ON public.compliance_alerts(created_at DESC);

-- Recreate RLS policy
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view compliance_alerts in own orgs" ON public.compliance_alerts;
CREATE POLICY "Users can view compliance_alerts in own orgs"
  ON public.compliance_alerts FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

COMMENT ON TABLE public.compliance_alerts IS 'Alerts from compliance sync: expired CDL/med card, missing vehicle inspection.';
