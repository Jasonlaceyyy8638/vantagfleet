import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { AdminSupportChatClient } from './AdminSupportChatClient';

export default async function AdminSupportChatPage() {
  const supabase = await createClient();
  if (!(await canAccessAdmin(supabase))) redirect('/admin');

  return (
    <div className="p-6">
      <AdminSupportChatClient />
    </div>
  );
}
