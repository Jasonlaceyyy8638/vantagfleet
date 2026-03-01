import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { listProfilesForAdmin, listOrganizationsForAdmin } from '@/app/actions/admin';
import { AdminPageClient } from './AdminPageClient';
import { ShieldCheck } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();
  const admin = await isAdmin(supabase);
  if (!admin) redirect('/');

  const [profiles, orgs] = await Promise.all([
    listProfilesForAdmin(),
    listOrganizationsForAdmin(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyber-amber/20">
          <ShieldCheck className="size-8 text-cyber-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-soft-cloud">Admin</h1>
          <p className="text-soft-cloud/60 mt-0.5">
            Create organizations and assign users. Midnight Ink · Cyber Amber.
          </p>
        </div>
      </div>

      <AdminPageClient initialProfiles={profiles} initialOrgs={orgs} />
    </div>
  );
}
