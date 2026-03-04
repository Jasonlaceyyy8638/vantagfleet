-- Driver status for Pool vs Archived (reactivate/archive).
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.drivers
  DROP CONSTRAINT IF EXISTS drivers_status_check;
ALTER TABLE public.drivers
  ADD CONSTRAINT drivers_status_check CHECK (status IN ('active', 'archived'));

UPDATE public.drivers SET status = 'active' WHERE status IS NULL;

COMMENT ON COLUMN public.drivers.status IS 'active = in pool or assigned; archived = quit/left, can be reactivated.';
