import { createClient } from '@/lib/supabase/server';
import { getPlatformRole, isPlatformStaff } from '@/lib/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Users, FileText, UserCog } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();
  const role = await getPlatformRole(supabase);
  if (!isPlatformStaff(role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-soft-cloud">Admin console</h1>
        <p className="text-soft-cloud/70 mt-1">
          Staff-only area. Customers do not see this screen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <Link
          href="/admin/team"
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-card hover:border-cyber-amber/30 hover:bg-cyber-amber/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <UserCog className="size-6 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">Team</h2>
            <p className="text-sm text-soft-cloud/60">
              Add employees, assign ADMIN or EMPLOYEE roles
            </p>
          </div>
        </Link>

        <Link
          href="/admin/support"
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-card hover:border-cyber-amber/30 hover:bg-cyber-amber/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-cyber-amber/20">
            <Users className="size-6 text-cyber-amber" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">Support</h2>
            <p className="text-sm text-soft-cloud/60">
              Customer search, add customer, issue refunds
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-card opacity-75">
          <div className="p-2 rounded-lg bg-electric-teal/20">
            <FileText className="size-6 text-electric-teal" />
          </div>
          <div>
            <h2 className="font-semibold text-soft-cloud">Audit log</h2>
            <p className="text-sm text-soft-cloud/60">
              View admin_logs (coming soon)
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-soft-cloud/50">
        <ShieldCheck className="size-4" />
        <span>Role: {role}</span>
      </div>
    </div>
  );
}
