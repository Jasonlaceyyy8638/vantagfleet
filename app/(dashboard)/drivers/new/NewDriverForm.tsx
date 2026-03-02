'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inviteDriver } from '@/app/actions/driver-invite';
import { Loader2 } from 'lucide-react';

const SUCCESS_MESSAGE = 'Invite sent! Driver can now upload their CDL via the VantagFleet App link.';

export function NewDriverForm({ orgId }: { orgId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);
    const result = await inviteDriver(orgId, { email: email.trim(), name: name.trim() });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setSuccess(true);
    setMessage(SUCCESS_MESSAGE);
    setName('');
    setEmail('');
  };

  if (success) {
    return (
      <div className="rounded-xl border border-electric-teal/30 bg-electric-teal/10 p-6">
        <p className="text-soft-cloud font-medium">{SUCCESS_MESSAGE}</p>
        <button
          type="button"
          onClick={() => { setSuccess(false); setMessage(''); router.push('/drivers'); }}
          className="mt-4 text-sm text-cyber-amber hover:underline"
        >
          Back to Drivers
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-midnight-ink/60 p-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-cloud-dancer mb-1">
          Driver&apos;s Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
          placeholder="Full name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-cloud-dancer mb-1">
          Driver&apos;s Email *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-cloud-dancer placeholder-cloud-dancer/50 focus:outline-none focus:ring-2 focus:ring-cyber-amber"
          placeholder="driver@example.com"
        />
      </div>
      {message && (
        <p className={`text-sm ${success ? 'text-electric-teal' : 'text-red-400'}`}>{message}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-bold hover:bg-cyber-amber/90 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Sending…
          </>
        ) : (
          'Send Invite'
        )}
      </button>
    </form>
  );
}
