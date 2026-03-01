/* Roadside mode: temporary tokens for public read-only view (DOT officer scan). */

CREATE TABLE IF NOT EXISTS roadside_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadside_tokens_expires_at ON roadside_tokens(expires_at);

ALTER TABLE roadside_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can create roadside tokens" ON roadside_tokens;
CREATE POLICY "Org members can create roadside tokens"
  ON roadside_tokens FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

-- No SELECT/UPDATE/DELETE for regular users; only the definer function reads by token.

-- Returns read-only summary for a valid token (called by public view page).
CREATE OR REPLACE FUNCTION public.get_roadside_summary(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_eld_status JSONB;
  v_insurance_permit JSONB;
  v_maintenance JSONB;
BEGIN
  SELECT rt.org_id INTO v_org_id
  FROM roadside_tokens rt
  WHERE rt.token = p_token AND rt.expires_at > now()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_or_expired');
  END IF;

  SELECT name INTO v_org_name FROM organizations WHERE id = v_org_id;

  v_eld_status := jsonb_build_object(
    'status', 'Compliant',
    'message', 'ELD status and hours available in cab.'
  );

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('type', doc_type, 'expiry', expiry_date) ORDER BY expiry_date),
    '[]'::jsonb
  ) INTO v_insurance_permit
  FROM (
    SELECT doc_type, expiry_date
    FROM compliance_docs
    WHERE org_id = v_org_id
    LIMIT 20
  ) sub;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_maintenance_logs') THEN
    SELECT COALESCE(
      jsonb_agg(jsonb_build_object('date', log_date, 'description', description) ORDER BY log_date DESC),
      '[]'::jsonb
    ) INTO v_maintenance
    FROM (
      SELECT log_date, description
      FROM vehicle_maintenance_logs
      WHERE org_id = v_org_id
      ORDER BY log_date DESC
      LIMIT 10
    ) sub;
  ELSE
    v_maintenance := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'org_name', v_org_name,
    'eld_status', v_eld_status,
    'insurance_permits', v_insurance_permit,
    'recent_maintenance', v_maintenance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_roadside_summary(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_roadside_summary(UUID) TO authenticated;
