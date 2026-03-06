'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin segment error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-soft-cloud/90 mb-2">Something went wrong loading the admin dashboard.</p>
      <p className="text-sm text-soft-cloud/60 mb-4 max-w-md">{error.message}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium hover:bg-cyber-amber/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
