'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoadsideToken } from '@/app/actions/roadside';
import { Smartphone, FileCheck, Wrench, QrCode, X } from 'lucide-react';
import Link from 'next/link';
import type { RoadsideSummary } from '@/app/actions/roadside';

type Props = { orgId: string; appOrigin: string; summary: RoadsideSummary | null };

export function RoadsideModeClient({ orgId, appOrigin, summary }: Props) {
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
          Jump to a section below or generate a QR code for the officer.
        </p>

        {/* Single nav strip – no duplicate cards */}
        <nav className="flex flex-wrap gap-2 justify-center">
          <a href="#eld" className="px-3 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium text-sm hover:bg-cyber-amber/30">
            ELD Status
          </a>
          <a href="#insurance" className="px-3 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium text-sm hover:bg-cyber-amber/30">
            Insurance / Permits
          </a>
          <a href="#maintenance" className="px-3 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium text-sm hover:bg-cyber-amber/30">
            Recent Maintenance
          </a>
        </nav>

        {/* Single instance of each module */}
        <div id="eld" className="scroll-mt-4 rounded-2xl bg-card border border-white/10 p-4 mt-2">
          <h2 className="font-semibold text-cyber-amber mb-2 flex items-center gap-2">
            <Smartphone className="size-5" />
            ELD Status
          </h2>
          <p className="text-soft-cloud/90 text-sm">
            {summary?.eld_status?.message ?? summary?.eld_status?.status ?? 'Compliant — ELD status and hours available in cab.'}
          </p>
          <p className="text-soft-cloud/50 text-xs mt-2">Previous 8-day logs and today’s logs are available in your ELD device in the cab.</p>
        </div>
        <div id="insurance" className="scroll-mt-4 rounded-2xl bg-card border border-white/10 p-4 mt-2">
          <h2 className="font-semibold text-cyber-amber mb-2 flex items-center gap-2">
            <FileCheck className="size-5" />
            Insurance / Permits
          </h2>
          {summary?.insurance_permits && summary.insurance_permits.length > 0 ? (
            <ul className="space-y-1 text-sm text-soft-cloud/90">
              {summary.insurance_permits.map((item: { type: string; expiry: string | null }, i: number) => (
                <li key={i}>
                  {item.type}
                  {item.expiry ? ` — expires ${item.expiry}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-soft-cloud/70 text-sm">No documents on file. Upload in Compliance or New Hire Documents.</p>
          )}
        </div>
        <div id="maintenance" className="scroll-mt-4 rounded-2xl bg-card border border-white/10 p-4 mt-2">
          <h2 className="font-semibold text-cyber-amber mb-2 flex items-center gap-2">
            <Wrench className="size-5" />
            Recent Maintenance
          </h2>
          {summary?.recent_maintenance && summary.recent_maintenance.length > 0 ? (
            <ul className="space-y-2 text-sm text-soft-cloud/90">
              {summary.recent_maintenance.map((item: { date: string; description: string | null }, i: number) => (
                <li key={i}>
                  <span className="text-soft-cloud/70">{item.date}</span>
                  {item.description ? ` — ${item.description}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-soft-cloud/70 text-sm">No recent maintenance records. Add inspections in Vehicles.</p>
          )}
        </div>

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
