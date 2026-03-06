import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthBackground } from '@/components/AuthBackground';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { ChangePasswordForm } from './ChangePasswordForm';

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/account/change-password');

  const params = await searchParams;
  const required = params.required === '1';

  return (
    <AuthBackground>
      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={64} className="h-16 w-16 shrink-0" />
          <h1 className="text-xl font-bold text-soft-cloud mt-4">
            {required ? 'Set your password' : 'Change password'}
          </h1>
        </div>
        <p className="text-soft-cloud/70 text-sm mb-4">
          {required
            ? 'You must set a new password before continuing. Use at least 8 characters.'
            : 'Set a new password for your account. Use at least 8 characters.'}
        </p>
        <ChangePasswordForm />
        {!required && (
          <p className="mt-4 text-center text-sm text-soft-cloud/90">
            <Link href="/dashboard" className="text-cyber-amber font-medium hover:underline">
              Back to dashboard
            </Link>
          </p>
        )}
      </div>
    </AuthBackground>
  );
}
