'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/PasswordInput';
import { changePasswordAndClearRequired } from '@/app/actions/change-password';

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = searchParams.get('required') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const result = await changePasswordAndClearRequired(newPassword);
    setLoading(false);
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error });
      return;
    }
    setMessage({ type: 'success', text: 'Password updated successfully.' });
    setNewPassword('');
    setConfirmPassword('');
    router.refresh();
    if (required) {
      const supabase = createClient();
      await supabase.auth.refreshSession();
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-soft-cloud/90 mb-1">
          New password
        </label>
        <PasswordInput
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-soft-cloud/90 mb-1">
          Confirm new password
        </label>
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
