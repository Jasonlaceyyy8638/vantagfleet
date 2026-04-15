'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import { HealthCard } from '@/components/HealthCard';

export type AuditRow = {
  date: string;
  vehicleId: string;
  motiveMiles: number;
  motusMiles: number;
  discrepancyPct: number;
  status: 'ok' | 'review' | 'pending';
};

// Placeholder data until Motus API is connected
const MOCK_AUDIT_ROWS: AuditRow[] = [
  { date: '2025-02-27', vehicleId: 'VH-1001', motiveMiles: 1247, motusMiles: 1240, discrepancyPct: 0.56, status: 'ok' },
  { date: '2025-02-27', vehicleId: 'VH-1002', motiveMiles: 892, motusMiles: 921, discrepancyPct: 3.25, status: 'review' },
  { date: '2025-02-26', vehicleId: 'VH-1003', motiveMiles: 2103, motusMiles: 0, discrepancyPct: 100, status: 'pending' },
  { date: '2025-02-26', vehicleId: 'VH-1004', motiveMiles: 445, motusMiles: 448, discrepancyPct: 0.67, status: 'ok' },
  { date: '2025-02-25', vehicleId: 'VH-1005', motiveMiles: 1567, motusMiles: 1598, discrepancyPct: 1.98, status: 'ok' },
  { date: '2025-02-25', vehicleId: 'VH-1006', motiveMiles: 778, motusMiles: 802, discrepancyPct: 3.09, status: 'review' },
];

function formatStatus(s: AuditRow['status']) {
  if (s === 'ok') return 'OK';
  if (s === 'review') return 'Review';
  return 'Pending';
}

function generateReportText(rows: AuditRow[]): string {
  const lines = [
    'VantagFleet TMS — Mileage reconciliation report (placeholder)',
    `Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} Z`,
    '',
    'Date       | Vehicle ID | Motive Miles | Motus Miles | Discrepancy % | Status',
    '-'.repeat(72),
    ...rows.map(
      (r) =>
        `${r.date} | ${r.vehicleId.padEnd(9)} | ${String(r.motiveMiles).padStart(11)} | ${String(r.motusMiles).padStart(10)} | ${String(r.discrepancyPct.toFixed(2)).padStart(13)}% | ${formatStatus(r.status)}`
    ),
    '',
    '--- End of report ---',
  ];
  return lines.join('\n');
}

export function AdminComplianceClient() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGeneratePdfAudit() {
    setSaving(true);
    setMessage(null);
    const report = generateReportText(MOCK_AUDIT_ROWS);
    const filename = `TMS_Mileage_Reconcile_${new Date().toISOString().slice(0, 10)}.txt`;

    try {
      const w = typeof window !== 'undefined' ? (window as unknown as { __TAURI__?: unknown; __TAURI_INTERNAL__?: unknown }) : null;
      if (w && (w.__TAURI__ || w.__TAURI_INTERNAL__)) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const path = await save({
          defaultPath: filename,
          filters: [{ name: 'Report', extensions: ['txt'] }],
        });
        if (path) {
          await writeTextFile(path, report);
          setMessage('Report saved to your chosen location.');
        }
      } else {
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setMessage('Report downloaded.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save report.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin"
          className="p-2 rounded-lg border border-white/10 text-soft-cloud hover:bg-white/5"
          aria-label="Back to admin"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-soft-cloud">Fuel & mileage reconciliation</h1>
          <p className="text-soft-cloud/60 text-sm">
            Compare telematics miles vs. third-party records for IFTA-ready reporting. Motus data pending API access.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 shrink-0">
          <HealthCard />
          <button
            type="button"
            onClick={handleGeneratePdfAudit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber text-black font-semibold hover:bg-cyber-amber/90 disabled:opacity-60 transition-colors"
          >
            <FileDown className="size-4" />
            {saving ? 'Saving…' : 'Export mileage report'}
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-soft-cloud/80 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
          {message}
        </p>
      )}

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 font-semibold text-soft-cloud/90">Date</th>
                <th className="px-4 py-3 font-semibold text-soft-cloud/90">Vehicle ID</th>
                <th className="px-4 py-3 font-semibold text-soft-cloud/90">Motive Miles</th>
                <th className="px-4 py-3 font-semibold text-soft-cloud/90">Motus Miles</th>
                <th className="px-4 py-3 font-semibold text-soft-cloud/90">Discrepancy %</th>
                <th className="px-4 py-3 font-semibold text-soft-cloud/90">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-soft-cloud/90">{row.date}</td>
                  <td className="px-4 py-3 text-soft-cloud/90 font-mono">{row.vehicleId}</td>
                  <td className="px-4 py-3 text-soft-cloud/90">{row.motiveMiles.toLocaleString()}</td>
                  <td className="px-4 py-3 text-soft-cloud/90">{row.motusMiles.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.discrepancyPct > 3
                          ? 'text-cyber-amber font-semibold'
                          : 'text-soft-cloud/90'
                      }
                    >
                      {row.discrepancyPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-soft-cloud/90">{formatStatus(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-soft-cloud/50">
        Table shows placeholder data until Motus API is connected. Export saves a text report—in the desktop app you can
        pick a folder; in the browser it downloads the file.
      </p>
    </div>
  );
}
