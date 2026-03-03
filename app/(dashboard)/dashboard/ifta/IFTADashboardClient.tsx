'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Fuel,
  Route,
  FileText,
  Lock,
  Upload,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadIftaReceipt } from '@/app/actions/ifta-upload';

type ReceiptRow = {
  id: string;
  receipt_date: string | null;
  state: string | null;
  gallons: number | null;
  status: string;
};

const QUARTERS = [
  { q: 1 as const, label: 'Q1 (Jan–Mar)' },
  { q: 2 as const, label: 'Q2 (Apr–Jun)' },
  { q: 3 as const, label: 'Q3 (Jul–Sep)' },
  { q: 4 as const, label: 'Q4 (Oct–Dec)' },
];

const CURRENT_YEAR = 2026;

export function IFTADashboardClient({
  iftaEnabled,
  profileId,
  currentQuarter: initialQuarter,
  currentYear: initialYear,
  initialReceipts,
}: {
  iftaEnabled: boolean;
  profileId: string | null;
  currentQuarter: 1 | 2 | 3 | 4;
  currentYear: number;
  initialReceipts: ReceiptRow[];
}) {
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(initialQuarter);
  const [year] = useState(initialYear);
  const [receipts, setReceipts] = useState<ReceiptRow[]>(initialReceipts);
  const [totalMiles, setTotalMiles] = useState<number | ''>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    receiptId: string;
    gallons: number;
    state: string;
    date?: string;
  } | null>(null);

  const totalGallons = receipts.reduce((sum, r) => sum + (r.gallons ?? 0), 0);
  const estimatedTaxCredit = totalGallons > 0 ? (totalGallons * 0.12).toFixed(2) : '—';
  const isScanning = scanningId !== null;

  const loadReceipts = useCallback(async (q: number, y: number) => {
    if (!profileId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('ifta_receipts')
      .select('id, receipt_date, state, gallons, status')
      .eq('user_id', profileId)
      .eq('quarter', q)
      .eq('year', y)
      .order('receipt_date', { ascending: false });
    setReceipts(
      (data ?? []).map((r) => ({
        id: r.id,
        receipt_date: r.receipt_date,
        state: r.state,
        gallons: r.gallons != null ? Number(r.gallons) : null,
        status: r.status ?? 'pending',
      }))
    );
  }, [profileId]);

  const handleQuarterChange = (q: 1 | 2 | 3 | 4) => {
    setQuarter(q);
    loadReceipts(q, year);
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !iftaEnabled || !profileId) return;
      setUploading(true);
      setScanError(null);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') continue;
        const formData = new FormData();
        formData.set('file', file);
        const result = await uploadIftaReceipt(profileId, quarter, year, formData);
        if (!result.ok) {
          setScanError(result.error);
          continue;
        }
        const { id, file_url } = result;
        setReceipts((prev) => [
          {
            id,
            receipt_date: null,
            state: null,
            gallons: null,
            status: 'pending',
          },
          ...prev,
        ]);
        setScanningId(id);
        try {
          const res = await fetch('/api/ifta/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiptUrl: file_url }),
          });
          const data = await res.json();
          if (!res.ok) {
            setScanError(data?.error ?? "We couldn't read this receipt. Please enter the data manually.");
            setScanningId(null);
            continue;
          }
          setReceipts((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: 'processed',
                    gallons: data.gallons ?? null,
                    state: data.state ?? null,
                    receipt_date: data.date ?? null,
                  }
                : r
            )
          );
          if (data.gallons != null && data.state != null) {
            setConfirmModal({
              receiptId: id,
              gallons: data.gallons,
              state: data.state,
              date: data.date,
            });
          }
        } catch {
          setScanError("Scan failed. Please enter the data manually.");
        }
        setScanningId(null);
      }
      setUploading(false);
    },
    [iftaEnabled, profileId, quarter, year]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (!iftaEnabled) {
    return (
      <div className="min-h-screen bg-midnight-ink p-6 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-card p-8 text-center shadow-xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-cyber-amber/20 flex items-center justify-center mb-4">
            <Lock className="size-8 text-cyber-amber" />
          </div>
          <h1 className="text-xl font-semibold text-soft-cloud mb-2">IFTA Dashboard Locked</h1>
          <p className="text-soft-cloud/70 text-sm mb-6">
            Unlock quarterly fuel tax reporting with the IFTA add-on. Upload receipts, track gallons by state, and get an estimated tax summary.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
          >
            Get IFTA Add-on
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight-ink p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-soft-cloud flex items-center gap-2">
              <Fuel className="size-7 text-cyber-amber" />
              IFTA Dashboard
            </h1>
            <p className="text-soft-cloud/60 text-sm mt-1">Quarterly fuel receipts and tax estimate</p>
          </div>
          <div className="flex rounded-lg border border-white/10 bg-card/50 p-1">
            {QUARTERS.map(({ q, label }) => (
              <button
                key={q}
                onClick={() => handleQuarterChange(q)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  quarter === q
                    ? 'bg-cyber-amber text-midnight-ink'
                    : 'text-soft-cloud/70 hover:text-soft-cloud hover:bg-white/5'
                }`}
              >
                {label} {year}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
              <Route className="size-4 text-cyber-amber" />
              Total Miles
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={totalMiles}
                onChange={(e) => setTotalMiles(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-28 bg-midnight-ink border border-white/10 rounded-lg px-3 py-2 text-soft-cloud focus:outline-none focus:ring-2 focus:ring-cyber-amber"
                placeholder="0"
              />
              <span className="text-soft-cloud/50 text-sm">mi</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
              <Fuel className="size-4 text-cyber-amber" />
              Total Gallons
            </div>
            <p className="text-xl font-semibold text-soft-cloud">{totalGallons.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
              <FileText className="size-4 text-cyber-amber" />
              Estimated Tax / Credit
            </div>
            <p className="text-xl font-semibold text-electric-teal">${estimatedTaxCredit}</p>
          </div>
        </div>

        {/* Receipt Hub */}
        <section className="rounded-xl border border-white/10 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
              <FileText className="size-5 text-cyber-amber" />
              Receipt Hub
            </h2>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg m-4 p-8 text-center transition-colors ${
              isDragging
                ? 'border-cyber-amber bg-cyber-amber/10'
                : 'border-white/20 hover:border-cyber-amber/50 bg-midnight-ink/50'
            }`}
          >
            <input
              type="file"
              id="ifta-upload"
              accept=".jpg,.jpeg,.png"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            {uploading || isScanning ? (
              <>
                <Loader2 className="size-10 mx-auto text-cyber-amber animate-spin mb-2" />
                <p className="text-soft-cloud/80 text-sm">
                  {isScanning ? 'Scanning with AI…' : 'Uploading…'}
                </p>
              </>
            ) : (
              <>
                <Upload className="size-10 mx-auto text-cyber-amber mb-2" />
                <p className="text-soft-cloud/80 text-sm">
                  Drag and drop fuel receipts (JPG/PNG) or click to browse
                </p>
              </>
            )}
          </div>

          {scanError && (
            <div className="mx-4 mb-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm">
              {scanError}
            </div>
          )}

          <div className="px-5 pb-5">
            <h3 className="text-sm font-medium text-soft-cloud/70 mb-3">Uploaded Receipts</h3>
            {receipts.length === 0 ? (
              <p className="text-soft-cloud/50 text-sm py-4">No receipts for this quarter yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-midnight-ink/80 text-soft-cloud/70 text-left">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">State</th>
                      <th className="px-4 py-3 font-medium">Gallons</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => {
                      const isScanning = scanningId === r.id;
                      return (
                        <tr key={r.id} className="border-t border-white/5 text-soft-cloud/90">
                          <td className="px-4 py-3">{r.receipt_date ?? '—'}</td>
                          <td className="px-4 py-3">{r.state ?? '—'}</td>
                          <td className="px-4 py-3">{r.gallons != null ? r.gallons.toFixed(1) : '—'}</td>
                          <td className="px-4 py-3">
                            {isScanning ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyber-amber/20 text-cyber-amber">
                                <Loader2 className="size-3.5 animate-spin" />
                                Scanning…
                              </span>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                  r.status === 'processed'
                                    ? 'bg-electric-teal/20 text-electric-teal'
                                    : 'bg-cyber-amber/20 text-cyber-amber'
                                }`}
                              >
                                {r.status === 'processed' ? 'Processed' : 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-ink/90 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-card p-6 shadow-xl border-cyber-amber/20">
            <h3 className="text-lg font-semibold text-soft-cloud mb-2">Confirm receipt data</h3>
            <p className="text-soft-cloud/80 text-sm mb-4">
              We found <strong className="text-cyber-amber">{confirmModal.gallons}</strong> gallons in <strong className="text-cyber-amber">{confirmModal.state}</strong>. Is this correct?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null);
                  setScanError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-soft-cloud hover:bg-white/5"
              >
                Edit manually
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null);
                  setScanError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90"
              >
                Yes, correct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}