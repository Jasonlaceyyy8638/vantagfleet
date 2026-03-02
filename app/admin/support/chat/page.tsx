import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AdminSupportChatClient } from './AdminSupportChatClient';

export default async function AdminSupportChatPage() {
  const supabase = await createClient();
  const ok = await isSuperAdmin(supabase);
  if (!ok) redirect('/admin');

  return (
    <div className="p-6">
      <AdminSupportChatClient />
    </div>
  );
}
