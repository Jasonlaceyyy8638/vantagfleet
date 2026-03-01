import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { LandingPage } from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = user ? await isAdmin(supabase) : false;
  return (
    <Suspense fallback={<div className="min-h-screen bg-midnight-ink" />}>
      <LandingPage isAuthenticated={!!user} isAdmin={admin} />
    </Suspense>
  );
}
