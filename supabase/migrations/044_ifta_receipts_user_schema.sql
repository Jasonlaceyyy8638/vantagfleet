-- Replace ifta_receipts with user-scoped schema and RLS.
DROP TRIGGER IF EXISTS ifta_receipts_updated_at ON public.ifta_receipts;
DROP TABLE IF EXISTS public.ifta_receipts;

CREATE TABLE public.ifta_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  gallons DOUBLE PRECISION,
  state TEXT,
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed'))
);

CREATE INDEX IF NOT EXISTS idx_ifta_receipts_user_id ON public.ifta_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_ifta_receipts_user_quarter_year ON public.ifta_receipts(user_id, year, quarter);

COMMENT ON TABLE public.ifta_receipts IS 'Fuel receipts for IFTA; user_id references profiles.id. RLS restricts to own receipts.';

ALTER TABLE public.ifta_receipts ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own receipts (via their profile id).
CREATE POLICY "Users can select own ifta_receipts"
  ON public.ifta_receipts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own ifta_receipts"
  ON public.ifta_receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own ifta_receipts"
  ON public.ifta_receipts
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own ifta_receipts"
  ON public.ifta_receipts
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
