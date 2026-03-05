import { notFound } from 'next/navigation';
import { getInspectSession } from '@/app/actions/inspect';
import { InspectClient } from './InspectClient';

type Props = { params: Promise<{ token: string }> };

export default async function InspectPage({ params }: Props) {
  const { token } = await params;
  const trimmed = token?.trim();
  if (!trimmed) notFound();

  const session = await getInspectSession(trimmed);

  if (!session.ok) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-[#1e293b] p-8 text-center">
          <h1 className="text-xl font-bold text-amber-400">Expired Inspection Session</h1>
          <p className="mt-3 text-[#94a3b8] text-sm">
            {session.reason === 'expired_session'
              ? 'This inspection link is older than 4 hours. Ask the driver to generate a new QR code from the Roadside screen.'
              : session.reason === 'expired_token'
                ? 'This link has expired. Generate a new one from the driver’s Roadside screen.'
                : 'This link is invalid or has been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0] relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center">
        <span className="text-[8rem] md:text-[12rem] font-black text-white transform -rotate-[-18deg] whitespace-nowrap">
          Certified by VantagFleet
        </span>
      </div>
      <InspectClient session={session} token={trimmed} />
    </div>
  );
}
