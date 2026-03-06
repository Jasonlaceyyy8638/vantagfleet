-- Profile system: profile photo URL, dispatcher status.
-- phone already exists on profiles (080_profiles_phone).
-- Assigned truck for drivers comes from drivers.assigned_vehicle_id -> vehicles.unit_number (no new column).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS dispatcher_status TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_dispatcher_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dispatcher_status_check
  CHECK (dispatcher_status IS NULL OR dispatcher_status IN ('Available', 'On Break', 'Off Duty'));

COMMENT ON COLUMN public.profiles.profile_image_url IS 'Public URL of profile/headshot image (e.g. Supabase Storage).';
COMMENT ON COLUMN public.profiles.dispatcher_status IS 'Dispatcher/Driver_Manager only: Available, On Break, or Off Duty.';
