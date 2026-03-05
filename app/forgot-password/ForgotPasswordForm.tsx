'use client';

import { useState } from 'react';
import { requestForgotPassword } from '@/app/actions/forgot-password';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await requestForgotPassword(email);
    setLoading(false);
    if (result.ok) {
      setMessage({ type: 'success', text: result.message });
      setEmail('');
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-soft-cloud/90 mb-1">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors"
          placeholder="you@company.com"
        />
      </div>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-electric-teal' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-midnight-ink font-semibold transition-colors"
      >
        {loading ? 'Sending…' : 'Send temporary password'}
      </button>
    </form>
  );
}
