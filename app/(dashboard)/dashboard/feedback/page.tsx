import { createClient } from '@/lib/supabase/server';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BetaFeedbackClient } from './BetaFeedbackClient';

export default async function BetaFeedbackPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);
  if (!orgId) redirect('/dashboard');

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-soft-cloud mb-2">Beta Tester Mission Checklist</h1>
      <p className="text-soft-cloud/70 mb-8">
        Complete these 5 tasks and report any issues so we can fix them fast.
      </p>
      <BetaFeedbackClient />
    </div>
  );
}
