'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Support error:', error);
  }, [error]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-soft-cloud/90 mb-2">Something went wrong on this page.</p>
      <p className="text-sm text-soft-cloud/60 mb-4 max-w-md">{error.message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium hover:bg-cyber-amber/90"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5"
        >
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
