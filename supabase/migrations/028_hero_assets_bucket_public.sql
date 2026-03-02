-- Make hero-assets bucket public so the landing page video (hero-truck.mp4) loads.
-- If this migration fails (e.g. storage.buckets is read-only in your plan), set it manually:
-- Supabase Dashboard → Storage → hero-assets → ⋮ → Configuration → Public bucket = ON
UPDATE storage.buckets
SET public = true
WHERE id = 'hero-assets';
