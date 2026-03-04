-- Add Dispatcher role for Enterprise multi-user (limited access vs Owner/Admin).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'Dispatcher'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'Dispatcher';
  END IF;
END
$$;

COMMENT ON TYPE app_role IS 'Owner = full; Safety_Manager = compliance; Driver = driver app; Dispatcher = limited (Enterprise).';
