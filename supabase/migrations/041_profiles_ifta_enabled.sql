-- Allow dashboard to show "Upload Fuel Receipts" when user has purchased IFTA add-on.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ifta_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.ifta_enabled IS 'Set to true when user completes one-time IFTA add-on purchase (Stripe webhook).';
