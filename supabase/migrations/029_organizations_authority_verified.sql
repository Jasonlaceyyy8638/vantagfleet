-- Track whether the carrier has provided proof of current insurance (BMC-91).
-- Used for Authority Status and "Compliance At Risk" in Admin when DOT (census) is active but insurance not verified.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS authority_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN organizations.authority_verified IS 'True when carrier has uploaded/verified current Insurance (BMC-91). When false with active DOT census, Admin shows Compliance At Risk.';
