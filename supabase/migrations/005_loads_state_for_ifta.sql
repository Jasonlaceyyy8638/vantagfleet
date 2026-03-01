/* Add optional state to loads for IFTA miles-by-state reporting. */

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'loads' AND column_name = 'state_code') THEN
    ALTER TABLE loads ADD COLUMN state_code TEXT;
  END IF;
END $$;

COMMENT ON COLUMN loads.state_code IS 'Primary state for this load (e.g. CA); used for quarterly IFTA miles-by-state summary.';
