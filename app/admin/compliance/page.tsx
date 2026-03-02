import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AdminComplianceClient } from './AdminComplianceClient';

export default async function AdminCompliancePage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (!admin) redirect('/admin');

  return (
    <Suspense fallback={<div className="text-soft-cloud/60 p-4">Loading…</div>}>
      <AdminComplianceClient />
    </Suspense>
  );
}
