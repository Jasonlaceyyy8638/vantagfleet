'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoadsideToken } from '@/app/actions/roadside';
import { Smartphone, FileCheck, Wrench, QrCode, X } from 'lucide-react';
import Link from 'next/link';

type Props = { orgId: string; appOrigin: string };

export function RoadsideModeClient({ orgId, appOrigin }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateQr = async () => {
    setLoading(true);
    setError('');
    setQrUrl(null);
    const { token, error: err } = await createRoadsideToken(orgId);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (token) setQrUrl(`${appOrigin}/roadside/view?t=${token}`);
  };

  const closeQr = () => {
    setQrUrl(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-midnight-ink text-soft-cloud pb-8">
      <header className="sticky top-0 z-10 bg-midnight-ink/95 backdrop-blur border-b border-white/10 px-4 py-4 safe-area-inset-top">
        <h1 className="text-2xl sm:text-3xl font-bold text-cyber-amber tracking-wide text-center">
          ROADSIDE READY
        </h1>
        <p className="text-soft-cloud/70 text-sm text-center mt-1">
          Show documents to officer
        </p>
      </header>

      <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto">
        <p className="text-soft-cloud/80 text-sm text-center">
          Tap a card to view. Generate a QR code for the officer to scan a read-only summary.
        </p>

        {/* Digital folder cards – large tap targets */}
        <a
          href="#eld"
          className="block w-full p-5 rounded-2xl bg-card border border-white/10 active:scale-[0.98] transition-transform min-h-[88px] flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-cyber-amber/20 shrink-0">
            <Smartphone className="size-8 text-cyber-amber" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-lg text-soft-cloud">ELD Status</span>
            <p className="text-sm text-soft-cloud/70 mt-0.5">Hours, device status</p>
          </div>
        </a>

        <a
          href="#insurance"
          className="block w-full p-5 rounded-2xl bg-card border border-white/10 active:scale-[0.98] transition-transform min-h-[88px] flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-cyber-amber/20 shrink-0">
            <FileCheck className="size-8 text-cyber-amber" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-lg text-soft-cloud">Insurance / Permits</span>
            <p className="text-sm text-soft-cloud/70 mt-0.5">Proof of insurance, authority</p>
          </div>
        </a>

        <a
          href="#maintenance"
          className="block w-full p-5 rounded-2xl bg-card border border-white/10 active:scale-[0.98] transition-transform min-h-[88px] flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-cyber-amber/20 shrink-0">
            <Wrench className="size-8 text-cyber-amber" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-lg text-soft-cloud">Recent Maintenance</span>
            <p className="text-sm text-soft-cloud/70 mt-0.5">Inspection and repair records</p>
          </div>
        </a>

        {/* QR generator button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleGenerateQr}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-cyber-amber text-midnight-ink font-bold text-lg disabled:opacity-60"
          >
            <QrCode className="size-6" />
            {loading ? 'Generating…' : 'Generate QR for officer'}
          </button>
          {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
        </div>

        <p className="text-soft-cloud/50 text-xs text-center pt-2">
          Link expires in 15 minutes. Officer sees read-only summary.
        </p>
      </div>

      {/* QR modal overlay */}
      {qrUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-label="QR code for officer"
        >
          <div className="bg-card border border-white/10 rounded-2xl p-6 max-w-[320px] w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-soft-cloud">Scan for read-only summary</span>
              <button
                type="button"
                onClick={closeQr}
                className="p-2 rounded-lg text-soft-cloud/70 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex justify-center bg-white p-4 rounded-xl">
              <QRCodeSVG value={qrUrl} size={220} level="M" />
            </div>
            <p className="text-soft-cloud/60 text-xs text-center mt-4">
              Valid 15 min · DOT officer scans to view
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 px-4 text-center">
        <Link
          href="/dashboard"
          className="text-soft-cloud/60 text-sm hover:text-soft-cloud"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
