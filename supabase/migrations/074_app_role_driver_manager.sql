-- Add Driver_Manager to app_role (Safety_Manager already exists from 001).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'Driver_Manager'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'Driver_Manager';
  END IF;
END
$$;

COMMENT ON TYPE app_role IS 'Owner = full; Safety_Manager = compliance; Driver_Manager = drivers/trailers; Driver = driver app; Dispatcher = limited (Enterprise).';
