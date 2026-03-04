-- IFTA mileage breakdown: multiple state-mile segments per load.
CREATE TABLE IF NOT EXISTS public.load_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  miles_driven NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_load_segments_load_id ON public.load_segments(load_id);
CREATE INDEX IF NOT EXISTS idx_load_segments_state_code ON public.load_segments(state_code);

ALTER TABLE public.load_segments ENABLE ROW LEVEL SECURITY;

-- Users can manage load_segments for loads in their org.
CREATE POLICY "Users can manage load_segments for loads in their org"
  ON public.load_segments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.loads l
      WHERE l.id = load_segments.load_id
      AND l.org_id IN (
        SELECT org_id FROM profiles WHERE user_id = auth.uid()
        UNION
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loads l
      WHERE l.id = load_segments.load_id
      AND l.org_id IN (
        SELECT org_id FROM profiles WHERE user_id = auth.uid()
        UNION
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.load_segments IS 'IFTA mileage by state per load; sum of miles_driven should match load total miles (loaded_miles + deadhead_miles).';
