-- Add plate_number to trailers (license plate).
ALTER TABLE public.trailers
  ADD COLUMN IF NOT EXISTS plate_number TEXT;

COMMENT ON COLUMN public.trailers.plate_number IS 'License plate number for the trailer.';
