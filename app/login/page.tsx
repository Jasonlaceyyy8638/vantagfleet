import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { Logo } from '@/components/Logo';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  const params = await searchParams;
  const redirectTo = params.redirectTo ?? '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-ink">
      <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-card p-6 shadow-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={64} className="h-16 w-16 shrink-0" />
          <h1 className="text-xl font-bold text-cyber-amber mt-4">Welcome to VantagFleet</h1>
        </div>
        <p className="text-cloud-dancer/70 text-sm mb-4">Sign in to your account</p>
        <LoginForm redirectTo={redirectTo} />
        {params.error === 'auth' && (
          <p className="mt-4 text-sm text-red-400">Authentication failed. Try again.</p>
        )}
        <p className="mt-4 text-center text-sm text-cloud-dancer/70">
          Don’t have an account?{' '}
          <a href="/signup" className="text-transformative-teal hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
