-- Dispatch phone for drivers to call from the Roadside tab.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS dispatch_phone TEXT;

COMMENT ON COLUMN public.organizations.dispatch_phone IS 'Phone number for drivers to call dispatch; shown on Driver Roadside tab. Set by owner in Settings.';
