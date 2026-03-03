-- IFTA fuel receipts per org/quarter for the IFTA Dashboard.
CREATE TABLE IF NOT EXISTS public.ifta_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  receipt_date DATE,
  state TEXT,
  gallons NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ifta_receipts_org_quarter ON public.ifta_receipts(org_id, quarter);
COMMENT ON TABLE public.ifta_receipts IS 'Fuel receipts for IFTA reporting; linked to org and quarter.';

ALTER TABLE public.ifta_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage ifta_receipts"
  ON public.ifta_receipts
  FOR ALL
  TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()))
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

-- Auto-update updated_at (set_updated_at exists from 001)
CREATE TRIGGER ifta_receipts_updated_at
  BEFORE UPDATE ON public.ifta_receipts
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
