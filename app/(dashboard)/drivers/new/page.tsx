import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getDashboardOrgId } from '@/lib/admin';
import Link from 'next/link';
import { NewDriverForm } from './NewDriverForm';
import { ChevronLeft } from 'lucide-react';

export default async function NewDriverPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-cloud-dancer/70">No organization selected.</p>
        <Link href="/drivers" className="text-cyber-amber hover:underline mt-2 inline-block">Back to Drivers</Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-lg">
      <Link
        href="/drivers"
        className="inline-flex items-center gap-1 text-sm text-soft-cloud/70 hover:text-soft-cloud mb-6"
      >
        <ChevronLeft className="size-4" />
        Back to Drivers
      </Link>
      <h1 className="text-2xl font-bold text-cloud-dancer mb-2">Invite a driver</h1>
      <p className="text-cloud-dancer/70 mb-6">
        Send an invite so they can set up their VantagFleet Roadside Shield and upload their CDL.
      </p>
      <NewDriverForm orgId={orgId} />
    </div>
  );
}
