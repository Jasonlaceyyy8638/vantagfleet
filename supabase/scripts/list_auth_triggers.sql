-- Run this in SQL Editor to see all triggers on auth.users.
-- If you see a trigger we didn't create (e.g. from Supabase Dashboard), drop it
-- so only our handle_new_user from migration 010 runs.
SELECT tgname AS trigger_name, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal;
