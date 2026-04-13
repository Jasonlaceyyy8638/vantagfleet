/* Load-centric TMS: customers, load lifecycle status, multi-stop routing, org-scoped RLS.
   Extends existing public.loads (003) with TMS fields; historical rows default to status = completed. */

-- -----------------------------------------------------------------------------
-- ENUM: Load lifecycle (TMS)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'load_lifecycle_status') THEN
    CREATE TYPE public.load_lifecycle_status AS ENUM (
      'available',
      'assigned',
      'dispatched',
      'in_transit',
      'delivered',
      'completed'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLE: customers (brokers / shippers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  mc_number TEXT,
  dot_number TEXT,
  credit_terms TEXT,
  billing_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(org_id);

COMMENT ON TABLE public.customers IS 'Brokers and shippers (counterparties) for TMS loads.';
COMMENT ON COLUMN public.customers.mc_number IS 'Broker MC number when applicable.';
COMMENT ON COLUMN public.customers.dot_number IS 'DOT number for verification / contracts.';
COMMENT ON COLUMN public.customers.credit_terms IS 'e.g. Net 30, QuickPay, COD.';

-- -----------------------------------------------------------------------------
-- TABLE: loads — add TMS columns (existing table from 003)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loads' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.loads
      ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loads' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.loads
      ADD COLUMN status public.load_lifecycle_status NOT NULL DEFAULT 'completed';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loads' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE public.loads ADD COLUMN reference_number TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loads' AND column_name = 'rate_to_carrier'
  ) THEN
    ALTER TABLE public.loads ADD COLUMN rate_to_carrier NUMERIC(14, 2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loads' AND column_name = 'driver_pay'
  ) THEN
    ALTER TABLE public.loads ADD COLUMN driver_pay NUMERIC(14, 2);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_loads_customer_id ON public.loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);

COMMENT ON COLUMN public.loads.status IS 'TMS lifecycle; legacy profit/IFTA loads default to completed.';
COMMENT ON COLUMN public.loads.rate_to_carrier IS 'Total pay to carrier for the load (USD).';
COMMENT ON COLUMN public.loads.driver_pay IS 'Driver portion (USD).';

-- -----------------------------------------------------------------------------
-- TABLE: load_stops (multi-stop pickup / delivery)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.load_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  sequence_order INT NOT NULL,
  stop_type TEXT NOT NULL CHECK (stop_type IN ('pickup', 'delivery')),
  location_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT load_stops_load_sequence_unique UNIQUE (load_id, sequence_order)
);

CREATE INDEX IF NOT EXISTS idx_load_stops_org_id ON public.load_stops(org_id);
CREATE INDEX IF NOT EXISTS idx_load_stops_load_id ON public.load_stops(load_id);

COMMENT ON TABLE public.load_stops IS 'Ordered stops for a load; org_id mirrors loads.org_id for RLS.';

-- Keep load_stops.org_id aligned with parent load
CREATE OR REPLACE FUNCTION public.set_load_stop_org_from_load()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org UUID;
BEGIN
  SELECT l.org_id INTO v_org FROM public.loads l WHERE l.id = NEW.load_id;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'load_stops: invalid load_id';
  END IF;
  NEW.org_id := v_org;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_load_stops_set_org ON public.load_stops;
CREATE TRIGGER trg_load_stops_set_org
  BEFORE INSERT OR UPDATE OF load_id ON public.load_stops
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_load_stop_org_from_load();

-- -----------------------------------------------------------------------------
-- RLS: customers
-- -----------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view customers in own orgs" ON public.customers;
CREATE POLICY "Users can view customers in own orgs"
  ON public.customers FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can insert customers in own orgs" ON public.customers;
CREATE POLICY "Users can insert customers in own orgs"
  ON public.customers FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can update customers in own orgs" ON public.customers;
CREATE POLICY "Users can update customers in own orgs"
  ON public.customers FOR UPDATE
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can delete customers in own orgs" ON public.customers;
CREATE POLICY "Users can delete customers in own orgs"
  ON public.customers FOR DELETE
  USING (org_id IN (SELECT public.user_org_ids()));

-- -----------------------------------------------------------------------------
-- RLS: load_stops
-- -----------------------------------------------------------------------------
ALTER TABLE public.load_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view load_stops in own orgs" ON public.load_stops;
CREATE POLICY "Users can view load_stops in own orgs"
  ON public.load_stops FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can insert load_stops in own orgs" ON public.load_stops;
CREATE POLICY "Users can insert load_stops in own orgs"
  ON public.load_stops FOR INSERT
  WITH CHECK (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can update load_stops in own orgs" ON public.load_stops;
CREATE POLICY "Users can update load_stops in own orgs"
  ON public.load_stops FOR UPDATE
  USING (org_id IN (SELECT public.user_org_ids()));

DROP POLICY IF EXISTS "Users can delete load_stops in own orgs" ON public.load_stops;
CREATE POLICY "Users can delete load_stops in own orgs"
  ON public.load_stops FOR DELETE
  USING (org_id IN (SELECT public.user_org_ids()));

-- -----------------------------------------------------------------------------
-- Triggers: updated_at
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS load_stops_updated_at ON public.load_stops;
CREATE TRIGGER load_stops_updated_at
  BEFORE UPDATE ON public.load_stops FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
