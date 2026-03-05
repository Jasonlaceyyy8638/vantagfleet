'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoadsideToken } from '@/app/actions/roadside';
import { QrCode, X } from 'lucide-react';

type Props = { orgId: string; appOrigin: string };

export function DotInspectionQrCard({ orgId, appOrigin }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateQr = async () => {
    setLoading(true);
    setError('');
    setQrUrl(null);
    const { token, error: err } = await createRoadsideToken(orgId, null, true);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (token) setQrUrl(`${appOrigin}/inspect/${token}`);
  };

  const closeQr = () => {
    setQrUrl(null);
    setError('');
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1e293b] p-4 flex flex-col">
      <h3 className="text-base font-semibold text-amber-400 mb-2 flex items-center gap-2">
        <QrCode className="size-5" />
        QR for officer
      </h3>
      <p className="text-sm text-[#94a3b8] mb-3">
        Generate a QR code so the officer can scan and view a read-only inspection summary. Link expires in 15 minutes.
      </p>
      <button
        type="button"
        onClick={handleGenerateQr}
        disabled={loading}
        className="roadside-btn w-full rounded-lg bg-[#f59e0b] text-black font-semibold px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate QR for officer'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {qrUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-label="QR code for officer"
        >
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-[320px] w-full">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-white">Scan for read-only summary</span>
              <button
                type="button"
                onClick={closeQr}
                className="p-2 rounded-lg text-[#94a3b8] hover:bg-white/10"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex justify-center bg-white p-4 rounded-xl">
              <QRCodeSVG value={qrUrl} size={220} level="M" />
            </div>
            <p className="text-[#94a3b8] text-xs text-center mt-4">Valid 15 min · DOT officer scans to view</p>
          </div>
        </div>
      )}
    </div>
  );
}
