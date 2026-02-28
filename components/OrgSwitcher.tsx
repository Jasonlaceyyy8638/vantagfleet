'use client';

import type { Organization } from '@/lib/types';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { setCurrentOrg } from '@/app/actions/org';

export function OrgSwitcher({
  organizations,
  currentOrgId,
}: {
  organizations: Organization[];
  currentOrgId: string | null;
  onSwitch?: (orgId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = organizations.find((o) => o.id === currentOrgId) ?? organizations[0];

  const handleSelect = (orgId: string) => {
    setOpen(false);
    setCurrentOrg(orgId);
  };

  if (organizations.length === 0) return null;
  if (organizations.length === 1)
    return (
      <div className="px-3 py-2 rounded-lg bg-deep-ink text-cloud-dancer text-sm font-medium">
        {current?.name ?? '—'}
      </div>
    );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-deep-ink hover:bg-deep-ink/80 text-cloud-dancer text-sm font-medium"
      >
        <span className="truncate">{current?.name ?? 'Select org'}</span>
        <ChevronDown className={`size-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <ul className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-[#30363d] bg-card shadow-lg py-1 max-h-60 overflow-auto">
            {organizations.map((org) => (
              <li key={org.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(org.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-deep-ink ${org.id === currentOrgId ? 'bg-deep-ink text-cloud-dancer' : 'text-cloud-dancer/90'}`}
                >
                  {org.name}
                  {org.usdot_number && (
                    <span className="text-cloud-dancer/60 ml-2">USDOT {org.usdot_number}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
