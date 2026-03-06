import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getNavbarRole } from '@/lib/admin';
import { LandingPage } from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'VantagFleet — Fleet Compliance & DOT Ready',
  description:
    'VantagFleet is the compliance dashboard that understands the road. IFTA reporting, audit exports, MCS-150, BOC-3, and driver tools. Enterprise grade. No more audit anxiety.',
  openGraph: {
    title: 'VantagFleet — Fleet Compliance & DOT Ready',
    description:
      'VantagFleet is the compliance dashboard that understands the road. IFTA, audit exports, and driver tools. Enterprise grade.',
    siteName: 'VantagFleet',
    type: 'website',
  },
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const navbarRole = user ? await getNavbarRole(supabase) : null;
  return (
    <Suspense fallback={<div className="min-h-screen bg-midnight-ink" />}>
      <LandingPage isAuthenticated={!!user} navbarRole={navbarRole} />
    </Suspense>
  );
}
