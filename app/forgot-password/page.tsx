import { AuthBackground } from '@/components/AuthBackground';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthBackground>
      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-[0_0_40px_-12px_rgba(255,176,0,0.15)]">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={64} className="h-16 w-16 shrink-0" />
          <h1 className="text-xl font-bold text-soft-cloud mt-4">Forgot password?</h1>
        </div>
        <p className="text-soft-cloud/70 text-sm mb-4">
          Enter your email and we&apos;ll send you a temporary password. After signing in, you can set a new password.
        </p>
        <ForgotPasswordForm />
        <p className="mt-4 text-center text-sm text-soft-cloud/90">
          <Link href="/login" className="text-cyber-amber font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}
