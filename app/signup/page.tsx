import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { SignUpForm } from './SignUpForm';
import { Logo } from '@/components/Logo';
import { AuthBackground } from '@/components/AuthBackground';
import Link from 'next/link';

const BETA_CAP = 5;

async function getBetaSpotsRemaining(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta_tester', true);
  if (error) return 0;
  return Math.max(0, BETA_CAP - (count ?? 0));
}

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = await isAdmin(supabase);
    redirect(admin ? '/admin' : '/dashboard');
  }

  const betaSpotsRemaining = await getBetaSpotsRemaining();

  return (
    <AuthBackground>
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]">
        <div className="flex flex-col items-center text-center mb-4">
          <Logo size={64} className="h-16 w-16 shrink-0" />
          <h1 className="text-xl font-bold text-soft-cloud mt-4">
            Welcome to <span className="text-soft-cloud">Vantag</span><span className="text-cyber-amber">Fleet</span>
          </h1>
          {betaSpotsRemaining > 0 && (
            <p className="mt-2 text-sm font-medium text-cyber-amber/90 bg-cyber-amber/10 border border-cyber-amber/30 rounded-full px-3 py-1">
              🎁 Beta Spot Active
            </p>
          )}
        </div>
        <p className="text-soft-cloud/70 text-sm mb-4">Register your company, then set your login.</p>
        <SignUpForm />
        <p className="mt-4 text-center text-sm text-soft-cloud/90">
          Already have an account?{' '}
          <Link href="/login" className="text-cyber-amber font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
