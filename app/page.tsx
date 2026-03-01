import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { LandingPage } from '@/components/LandingPage';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <Suspense fallback={<div className="min-h-screen bg-midnight-ink" />}>
      <LandingPage isAuthenticated={!!user} />
    </Suspense>
  );
}
