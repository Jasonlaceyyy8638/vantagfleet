/* Add Stripe customer ID to organizations for billing portal. */

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe Customer ID (cus_...) for billing portal and subscription management.';
