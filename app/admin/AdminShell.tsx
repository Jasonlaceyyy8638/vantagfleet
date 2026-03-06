'use client';

import { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

export function AdminShell({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud flex">
      <AdminSidebar
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto pt-14 md:pt-0 p-4 sm:p-6 md:p-8 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
