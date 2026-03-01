'use client';

import { useState } from 'react';

export function CopyUserId({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <code className="text-sm text-soft-cloud/90 bg-midnight-ink/80 px-2 py-1.5 rounded break-all">
        {userId}
      </code>
      <button
        type="button"
        onClick={copy}
        className="text-sm px-2 py-1 rounded border border-white/20 text-soft-cloud/80 hover:bg-white/10"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
