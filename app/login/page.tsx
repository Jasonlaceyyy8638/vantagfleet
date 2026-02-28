import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-sm rounded-xl border border-slate-700/80 bg-slate-800/80 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Vantag Fleet</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in to your account</p>
        <LoginForm redirectTo={redirectTo} />
        {params.error === 'auth' && (
          <p className="mt-4 text-sm text-red-400">Authentication failed. Try again.</p>
        )}
        <p className="mt-4 text-center text-sm text-slate-400">
          Don’t have an account?{' '}
          <a href="/signup" className="text-primary-400 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
