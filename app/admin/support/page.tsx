import { Suspense } from 'react';
import { AdminSupportClient } from './AdminSupportClient';

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="text-soft-cloud/60 p-4">Loading…</div>}>
      <AdminSupportClient />
    </Suspense>
  );
}
