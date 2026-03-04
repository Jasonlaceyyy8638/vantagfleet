import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { LoginForm } from './LoginForm';
import { Logo } from '@/components/Logo';
import { AuthBackground } from '@/components/AuthBackground';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = await isAdmin(supabase);
    redirect(admin ? '/admin' : '/dashboard');
  }

  const params = await searchParams;
  const redirectTo = params.redirectTo ?? '/dashboard';

  return (
    <AuthBackground>
      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={64} className="h-16 w-16 shrink-0" />
          <h1 className="text-xl font-bold text-soft-cloud mt-4">
            Welcome to <span className="text-cyber-amber">Vantag</span>Fleet
          </h1>
        </div>
        <p className="text-soft-cloud/70 text-sm mb-4">Sign in to your account</p>
        <LoginForm redirectTo={redirectTo} />
        {params.error === 'auth' && (
          <p className="mt-4 text-sm text-red-400">Authentication failed. Try again.</p>
        )}
        <p className="mt-4 text-center text-sm text-soft-cloud/90">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-cyber-amber font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
