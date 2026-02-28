'use client';

import { createInviteLink } from '@/app/actions/org';
import { useState } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';

export function InviteButton({ orgId }: { orgId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setLink(null);
    const result = await createInviteLink(orgId);
    setLoading(false);
    if (result.error) setError(result.error);
    else if (result.link) setLink(result.link);
  };

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[#30363d] bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="size-5 text-cloud-dancer/60" />
        <h2 className="font-semibold text-cloud-dancer">Invite team members</h2>
      </div>
      <p className="text-sm text-cloud-dancer/70 mb-4">
        Generate a link for employees to join this organization.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink text-sm font-medium"
      >
        {loading ? 'Generating…' : 'Invite'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {link && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#30363d] text-cloud-dancer text-sm hover:bg-deep-ink"
          >
            {copied ? <Check className="size-4 text-transformative-teal" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
