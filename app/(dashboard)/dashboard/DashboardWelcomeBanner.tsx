'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export function DashboardWelcomeBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setShow(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('status');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div className="mb-6 rounded-xl border border-electric-teal/30 bg-electric-teal/10 px-4 py-3 flex items-center gap-3">
      <Sparkles className="size-5 text-electric-teal shrink-0" />
      <p className="text-soft-cloud font-medium">Welcome! Your subscription is active.</p>
    </div>
  );
}
