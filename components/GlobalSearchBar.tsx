'use client';

import { Search } from 'lucide-react';

type GlobalSearchBarProps = {
  mode: 'broker' | 'carrier';
};

/**
 * Role-aware global search chrome. Placeholder until backend search APIs exist.
 */
export function GlobalSearchBar({ mode }: GlobalSearchBarProps) {
  const placeholder =
    mode === 'broker'
      ? 'Search carrier MC#, origin or destination…'
      : 'Search driver name or truck ID…';

  return (
    <div className="px-3 pb-2">
      <label htmlFor="global-dashboard-search" className="sr-only">
        Search
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-soft-cloud/45"
          aria-hidden
        />
        <input
          id="global-dashboard-search"
          type="search"
          name="q"
          placeholder={placeholder}
          readOnly
          tabIndex={-1}
          className="w-full cursor-default rounded-lg border border-white/10 bg-midnight-ink/80 py-2 pl-9 pr-3 text-sm text-soft-cloud/90 placeholder:text-soft-cloud/40"
          title="Search coming soon"
        />
      </div>
    </div>
  );
}
