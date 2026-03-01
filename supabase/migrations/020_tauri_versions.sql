-- Tauri auto-updater: store release versions per target (windows, darwin, linux).
-- API route /api/update/[target]/[version] queries this to return download_url + signature when a newer version exists.

CREATE TABLE IF NOT EXISTS public.tauri_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL CHECK (target IN ('windows', 'darwin', 'linux')),
  version TEXT NOT NULL,
  download_url TEXT NOT NULL,
  signature TEXT NOT NULL,
  notes TEXT,
  pub_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tauri_versions_target_version
  ON public.tauri_versions (target, version);

COMMENT ON TABLE public.tauri_versions IS 'Tauri desktop app releases for auto-updater; version must be semver (e.g. 0.1.0).';

-- Allow public read for update check (no auth required).
ALTER TABLE public.tauri_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for updater"
  ON public.tauri_versions FOR SELECT
  USING (true);

-- Inserts/updates only via service role (admin or CI).
CREATE POLICY "Service role can manage tauri_versions"
  ON public.tauri_versions FOR ALL
  USING (false)
  WITH CHECK (false);
