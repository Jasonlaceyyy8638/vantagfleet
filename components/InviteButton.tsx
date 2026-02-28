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
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-5">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="size-5 text-slate-400" />
        <h2 className="font-semibold text-white">Invite team members</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Generate a link for employees to join this organization.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-medium"
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
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-300 text-sm"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700/50"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
