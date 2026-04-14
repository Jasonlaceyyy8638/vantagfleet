'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export function DashboardWelcomeBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<'success' | 'access' | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const welcome = searchParams.get('welcome');
    if (status === 'success' || welcome === 'access') {
      setShow(true);
      setMessage(welcome === 'access' ? 'access' : 'success');
      const url = new URL(window.location.href);
      url.searchParams.delete('status');
      url.searchParams.delete('welcome');
      router.replace(url.pathname + (url.search || '?').replace(/^\?$/, ''), { scroll: false });
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div className="mb-6 rounded-xl border border-electric-teal/30 bg-electric-teal/10 px-4 py-3 flex items-center gap-3">
      <Sparkles className="size-5 text-electric-teal shrink-0" />
      <p className="text-soft-cloud font-medium">
        {message === 'access'
          ? 'Welcome! Your account is ready—explore the dashboard and finish setup.'
          : 'Welcome! Your subscription is active.'}
      </p>
    </div>
  );
}
