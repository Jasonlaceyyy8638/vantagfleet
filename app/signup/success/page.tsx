import { Suspense } from 'react';
import SignupSuccessContent from './SignupSuccessContent';

function SignupSuccessFallback() {
  return (
    <div className="relative min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="font-mono text-soft-cloud/60 text-sm">[SYSTEM] Initializing...</div>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<SignupSuccessFallback />}>
      <SignupSuccessContent />
    </Suspense>
  );
}
