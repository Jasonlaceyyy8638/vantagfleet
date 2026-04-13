'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Fuel,
  Route,
  FileText,
  FileArchive,
  Upload,
  Loader2,
  CheckCircle2,
  Download,
  ImageIcon,
  BarChart3,
  Plug,
  AlertTriangle,
  DollarSign,
  Settings,
  PenLine,
  X,
} from 'lucide-react';
import { calculateIfta } from '@/lib/ifta-calculate';
import { createClient } from '@/lib/supabase/client';
import { uploadIftaReceipt } from '@/app/actions/ifta-upload';
import { updateIftaReceipt, approveIftaReceipt } from '@/app/actions/ifta-receipts';
import { UpgradeOverlay } from '@/components/UpgradeOverlay';
import { SmartErrorAction } from '@/components/SmartErrorAction';
import { AuditExportModal } from '@/components/AuditExportModal';

type ReceiptRow = {
  id: string;
  receipt_date: string | null;
  state: string | null;
  gallons: number | null;
  status: string;
  file_url: string | null;
  /** Demo / sandbox metadata for receipt viewer */
  vendor?: string | null;
  fuel_type?: string | null;
  amount?: number | null;
};

const QUARTERS = [
  { q: 1 as const, label: 'Q1 (Jan–Mar)' },
  { q: 2 as const, label: 'Q2 (Apr–Jun)' },
  { q: 3 as const, label: 'Q3 (Jul–Sep)' },
  { q: 4 as const, label: 'Q4 (Oct–Dec)' },
];

const CREDIT_RATE = 0.12;

function buildCsv(rows: ReceiptRow[]): string {
  const header = 'Date,State,Gallons,Status\n';
  const body = rows
    .map(
      (r) =>
        `${r.receipt_date ?? ''},${r.state ?? ''},${r.gallons ?? ''},${r.status}`
    )
    .join('\n');
  return header + body;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type StateMiles = { state_code: string; miles: number };

export function IFTADashboardClient({
  iftaEnabled,
  profileId,
  orgId,
  currentQuarter: initialQuarter,
  currentYear: initialYear,
  initialReceipts,
  isSoloPro = false,
  isDispatcher = false,
  demoMode = false,
}: {
  iftaEnabled: boolean;
  profileId: string | null;
  orgId: string | null;
  currentQuarter: 1 | 2 | 3 | 4;
  currentYear: number;
  initialReceipts: ReceiptRow[];
  isSoloPro?: boolean;
  isDispatcher?: boolean;
  /** Unauthenticated sandbox: receipts are static; uploads and server writes are disabled. */
  demoMode?: boolean;
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
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: 'receipt_date' | 'state' | 'gallons';
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [motiveMilesByState, setMotiveMilesByState] = useState<StateMiles[]>([]);
  const [motiveTotalMiles, setMotiveTotalMiles] = useState(0);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [mileageLoading, setMileageLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [auditExportModalOpen, setAuditExportModalOpen] = useState(false);
  const [receiptViewer, setReceiptViewer] = useState<{
    url: string;
    vendor?: string | null;
    amount?: number | null;
    state?: string | null;
    gallons?: number | null;
    fuel_type?: string | null;
    date?: string | null;
  } | null>(null);

  const processedOnly = receipts.filter((r) =>
    demoMode ? r.status === 'processed' || r.status === 'verified' : r.status === 'processed'
  );
  const quarterlyTotalGallons = processedOnly.reduce((sum, r) => sum + (r.gallons ?? 0), 0);
  const totalFuelCredits = quarterlyTotalGallons * CREDIT_RATE;
  const processedCount = processedOnly.length;
  const verifiedReceipts = receipts.filter((r) => r.status === 'verified');
  const isScanning = scanningId !== null;

  const fuelByState = (() => {
    const map: Record<string, number> = {};
    processedOnly.forEach((r) => {
      const state = r.state?.trim().toUpperCase().slice(0, 2);
      if (!state) return;
      map[state] = (map[state] ?? 0) + (r.gallons ?? 0);
    });
    return Object.entries(map).map(([state_code, gallons]) => ({ state_code, gallons }));
  })();

  const totalGallonsForMpg = quarterlyTotalGallons;
  const milesForMpg = motiveTotalMiles > 0 ? motiveTotalMiles : (typeof totalMiles === 'number' ? totalMiles : 0);
  const mpg = totalGallonsForMpg > 0 && milesForMpg > 0 ? milesForMpg / totalGallonsForMpg : 0;

  const allStates = Array.from(
    new Set([...motiveMilesByState.map((s) => s.state_code), ...fuelByState.map((s) => s.state_code)])
  ).sort();

  const mileageSummaryRows = allStates.map((state_code) => {
    const motiveMiles = motiveMilesByState.find((s) => s.state_code === state_code)?.miles ?? 0;
    const fuelGal = fuelByState.find((s) => s.state_code === state_code)?.gallons ?? 0;
    const taxableFuelGal = mpg > 0 ? motiveMiles / mpg : 0;
    const gap = fuelGal > 0 ? taxableFuelGal - fuelGal : null;
    return { state_code, motiveMiles, fuelGal, taxableFuelGal, gap };
  });

  const iftaResult = calculateIfta(
    motiveMilesByState,
    fuelByState,
    quarter,
    year
  );

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const loadReceipts = useCallback(async (q: number, y: number) => {
    if (demoMode) return;
    if (!profileId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('ifta_receipts')
      .select('id, receipt_date, state, gallons, status, file_url')
      .eq('user_id', profileId)
      .eq('quarter', q)
      .eq('year', y)
      .order('receipt_date', { ascending: false, nullsFirst: false });
    setReceipts(
      (data ?? []).map((r) => ({
        id: r.id,
        receipt_date: r.receipt_date,
        state: r.state,
        gallons: r.gallons != null ? Number(r.gallons) : null,
        status: r.status ?? 'pending',
        file_url: r.file_url ?? null,
      }))
    );
  }, [profileId, demoMode]);

  const loadMileage = useCallback(async (q: number, y: number) => {
    setMileageLoading(true);
    setMileageError(null);
    try {
      const res = await fetch(`/api/ifta/mileage?quarter=${q}&year=${y}`);
      const data = await res.json().catch(() => ({}));
      if (data.error) {
        setMileageError(data.error);
        setMotiveMilesByState([]);
        setMotiveTotalMiles(0);
      } else {
        setMotiveMilesByState(data.milesByState ?? []);
        setMotiveTotalMiles(Number(data.totalMiles) || 0);
      }
    } catch {
      setMileageError('Failed to load ELD mileage.');
      setMotiveMilesByState([]);
      setMotiveTotalMiles(0);
    } finally {
      setMileageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (demoMode) {
      setMotiveMilesByState([]);
      setMotiveTotalMiles(0);
      setMileageError(null);
      return;
    }
    if (iftaEnabled && orgId) loadMileage(quarter, year);
    else {
      setMotiveMilesByState([]);
      setMotiveTotalMiles(0);
      setMileageError(null);
    }
  }, [iftaEnabled, orgId, quarter, year, loadMileage, demoMode]);

  const handleQuarterChange = (q: 1 | 2 | 3 | 4) => {
    setQuarter(q);
    setEditingCell(null);
    loadReceipts(q, year);
  };

  const startEdit = (id: string, field: 'receipt_date' | 'state' | 'gallons', current: string | number | null) => {
    setEditingCell({ id, field });
    setEditValue(current != null ? String(current) : '');
    setUpdateError(null);
  };

  const saveEdit = useCallback(async () => {
    if (demoMode || !editingCell || !profileId) return;
    setUpdateError(null);
    const receipt = receipts.find((r) => r.id === editingCell.id);
    if (!receipt) {
      setEditingCell(null);
      return;
    }
    let payload: { receipt_date?: string | null; state?: string | null; gallons?: number | null } = {};
    if (editingCell.field === 'receipt_date') {
      const val = editValue.trim() || null;
      payload.receipt_date = val;
    } else if (editingCell.field === 'state') {
      const val = editValue.trim().slice(0, 2).toUpperCase() || null;
      payload.state = val;
    } else {
      const num = editValue.trim() === '' ? null : Number(editValue);
      payload.gallons = num != null && !Number.isNaN(num) ? num : receipt.gallons;
    }
    const result = await updateIftaReceipt(profileId, editingCell.id, payload);
    if (!result.ok) {
      setUpdateError(result.error);
      return;
    }
    setReceipts((prev) =>
      prev.map((r) =>
        r.id !== editingCell.id
          ? r
          : {
              ...r,
              ...(editingCell.field === 'receipt_date' && { receipt_date: payload.receipt_date ?? null }),
              ...(editingCell.field === 'state' && { state: payload.state ?? null }),
              ...(editingCell.field === 'gallons' && { gallons: payload.gallons ?? null }),
            }
      )
    );
    setEditingCell(null);
  }, [editingCell, editValue, profileId, receipts, demoMode]);

  const handleApprove = useCallback(
    async (receiptId: string) => {
      if (demoMode || !profileId) return;
      setApprovingId(receiptId);
      setUpdateError(null);
      const result = await approveIftaReceipt(profileId, receiptId);
      if (!result.ok) {
        setUpdateError(result.error);
      } else {
        setReceipts((prev) =>
          prev.map((r) => (r.id === receiptId ? { ...r, status: 'verified' } : r))
        );
      }
      setApprovingId(null);
    },
    [profileId, demoMode]
  );

  const handleExport = useCallback(() => {
    const csv = buildCsv(verifiedReceipts);
    downloadCsv(csv, `IFTA_Q${quarter}_${year}_Report.csv`);
  }, [verifiedReceipts, quarter, year]);

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/ifta/pdf?quarter=${quarter}&year=${year}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? 'Failed to generate PDF.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IFTA_Q${quarter}_${year}_Return.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF.');
    } finally {
      setPdfLoading(false);
    }
  }, [quarter, year]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (demoMode || !files?.length || !iftaEnabled || !profileId) return;
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
            file_url,
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
          let data: { error?: string; gallons?: number; state?: string; date?: string };
          try {
            data = await res.json();
          } catch {
            setScanError("Invalid response from server. Please enter the data manually.");
            setScanningId(null);
            continue;
          }
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
          setScanError('Scan failed. Please enter the data manually.');
        }
        setScanningId(null);
      }
      setUploading(false);
    },
    [iftaEnabled, profileId, quarter, year, demoMode]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const showEldSetup =
    iftaEnabled && orgId && !mileageLoading && mileageError && !useManualEntry;

  if (showEldSetup) {
    return (
      <UpgradeOverlay hasAccess={iftaEnabled} title="IFTA Scanner">
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
            <div className="rounded-2xl border border-white/10 bg-card p-8 md:p-10 text-center max-w-xl mx-auto">
              <div className="rounded-full bg-amber-500/10 p-4 inline-flex mb-4">
                <Plug className="size-10 text-cyber-amber" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-soft-cloud mb-2">Setup IFTA</h2>
              <p className="text-soft-cloud/80 text-sm mb-6">
                To automate your quarterly filings, connect your ELD in Settings.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard/integrations"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
                >
                  <Settings className="size-5" />
                  Connect ELD in Settings
                </Link>
                {isSoloPro && (
                  <button
                    type="button"
                    onClick={() => setUseManualEntry(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-soft-cloud font-medium hover:bg-white/5 transition-colors"
                  >
                    <PenLine className="size-5" />
                    Enter data manually
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </UpgradeOverlay>
    );
  }

  const content = (
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

        {/* Quarterly Totals — processed only */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-soft-cloud/80 uppercase tracking-wider mb-3">
            Quarterly Totals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-card p-5">
              <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
                <FileText className="size-4 text-electric-teal" />
                Total Fuel Credits
              </div>
              <p className="text-xl font-semibold text-electric-teal">
                ${totalFuelCredits.toFixed(2)}
              </p>
              <p className="text-xs text-soft-cloud/50 mt-0.5">From processed receipts this quarter</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-card p-5">
              <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
                <Fuel className="size-4 text-cyber-amber" />
                Total Gallons
              </div>
              <p className="text-xl font-semibold text-soft-cloud">
                {quarterlyTotalGallons.toFixed(1)}
              </p>
              <p className="text-xs text-soft-cloud/50 mt-0.5">Processed this quarter</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-card p-5">
              <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
                <Route className="size-4 text-cyber-amber" />
                Processed Receipts
              </div>
              <p className="text-xl font-semibold text-soft-cloud">{processedCount}</p>
              <p className="text-xs text-soft-cloud/50 mt-0.5">With extracted data (not yet approved)</p>
            </div>
          </div>
        </section>

        {/* Total Miles (optional) + Export + PDF + Audit Export (hidden for Dispatcher) */}
        <div className={`grid grid-cols-1 gap-4 mb-8 ${isDispatcher ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <div className="flex items-center gap-2 text-soft-cloud/60 text-sm mb-1">
              <Route className="size-4 text-cyber-amber" />
              Total Miles (optional)
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
          {!isDispatcher && (
            <>
              <div className="rounded-xl border border-white/10 bg-card p-5 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={verifiedReceipts.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-electric-teal/50 bg-electric-teal/10 text-electric-teal font-medium hover:bg-electric-teal/20 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <Download className="size-5" />
                  Export Q{quarter} Report
                </button>
                <p className="text-xs text-soft-cloud/50 mt-1.5">
                  CSV of verified receipts for this quarter
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-card p-5 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 bg-white/5 text-soft-cloud font-medium hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {pdfLoading ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
                  Download Q{quarter} {year} Return (PDF)
                </button>
                <p className="text-xs text-soft-cloud/50 mt-1.5">
                  IFTA-100 style return with reconciled data and total balance due
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-card p-5 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={() => setAuditExportModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber font-medium hover:bg-cyber-amber/20 transition-colors"
                >
                  <FileArchive className="size-5" />
                  Generate Audit Export
                </button>
                <p className="text-xs text-soft-cloud/50 mt-1.5">
                  ZIP with Summary Report and Detailed Trip Log (state line crossings)
                </p>
              </div>
            </>
          )}
        </div>

        <AuditExportModal
          open={auditExportModalOpen}
          onClose={() => setAuditExportModalOpen(false)}
          defaultQuarter={quarter}
          defaultYear={year}
        />

        {/* Mileage Summary + Gap Analysis (ELD vs receipts) */}
        <section className="rounded-xl border border-white/10 bg-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
              <BarChart3 className="size-5 text-cyber-amber" />
              Mileage Summary
            </h2>
            {orgId && (
              <span className="text-xs text-soft-cloud/50 flex items-center gap-1">
                <Plug className="size-3.5 text-electric-teal" />
                ELD integration • Q{quarter} dates: {quarter === 1 ? 'Jan 1 – Mar 31' : quarter === 2 ? 'Apr 1 – Jun 30' : quarter === 3 ? 'Jul 1 – Sep 30' : 'Oct 1 – Dec 31'}
              </span>
            )}
          </div>
          <div className="p-5">
            {!orgId ? (
              <p className="text-sm text-soft-cloud/50">Select an organization to see ELD mileage.</p>
            ) : mileageLoading ? (
              <div className="flex items-center gap-2 py-6 text-soft-cloud/70">
                <Loader2 className="size-5 animate-spin text-cyber-amber" />
                Loading ELD mileage…
              </div>
            ) : mileageError ? (
              <div className="space-y-4">
                <SmartErrorAction
                  errorMessage={mileageError}
                  label="ELD mileage unavailable"
                />
                <div className="rounded-xl border border-white/10 bg-card/50 p-4 text-center">
                  <p className="text-sm text-soft-cloud/60 mb-3">
                    Connect your ELD (Motive or Geotab) to auto-generate state-by-state mileage and simplify your IFTA reporting.
                  </p>
                  <Link
                    href="/dashboard/integrations"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 transition-colors"
                  >
                    <Plug className="size-5" />
                    Connect ELD to Auto-Generate IFTA
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-soft-cloud/50 mb-4">
                  MPG = Total Miles ÷ Total Gallons. Taxable fuel per state = State Miles ÷ MPG. Compare ELD miles vs scanned receipt fuel by state.
                </p>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-midnight-ink/80 text-soft-cloud/70 text-left">
                        <th className="px-3 py-2.5 font-medium">State</th>
                        <th className="px-3 py-2.5 font-medium text-right">State Miles (ELD)</th>
                        <th className="px-3 py-2.5 font-medium text-right">Fuel (receipts) gal</th>
                        <th className="px-3 py-2.5 font-medium text-right">Taxable fuel (gal)</th>
                        <th className="px-3 py-2.5 font-medium text-right">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mileageSummaryRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-soft-cloud/50 text-center">
                            No mileage or fuel data for this quarter. Connect your ELD and add receipts.
                          </td>
                        </tr>
                      ) : (
                        mileageSummaryRows.map((row) => (
                          <tr key={row.state_code} className="border-t border-white/5 text-soft-cloud/90">
                            <td className="px-3 py-2 font-medium">{row.state_code}</td>
                            <td className="px-3 py-2 text-right">{row.motiveMiles.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="px-3 py-2 text-right">{row.fuelGal.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right text-electric-teal">{row.taxableFuelGal.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right">
                              {row.gap != null ? (
                                <span className={row.gap >= 0 ? 'text-electric-teal/90' : 'text-cyber-amber/90'}>
                                  {row.gap >= 0 ? '+' : ''}{row.gap.toFixed(1)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {mpg > 0 && (
                  <p className="text-xs text-soft-cloud/50 mt-3">
                    Fleet MPG this quarter: <span className="text-electric-teal font-medium">{mpg.toFixed(1)}</span> (Total Miles ÷ Total Gallons)
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* Final Tax Liability (reconciler output) */}
        <section className="rounded-xl border border-white/10 bg-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-soft-cloud flex items-center gap-2">
              <DollarSign className="size-5 text-electric-teal" />
              Final Tax Liability
            </h2>
            <p className="text-xs text-soft-cloud/50 mt-1">
              Net tax owed = (tax required from miles) − (tax already paid on receipts). 2026 Q1 diesel rates applied.
            </p>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-midnight-ink/80 text-soft-cloud/70 text-left">
                    <th className="px-3 py-2.5 font-medium">State</th>
                    <th className="px-3 py-2.5 font-medium text-right">Miles</th>
                    <th className="px-3 py-2.5 font-medium text-right">Gallons</th>
                    <th className="px-3 py-2.5 font-medium text-right">Net Owed / Refund</th>
                    <th className="px-3 py-2.5 font-medium text-right w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {iftaResult.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-soft-cloud/50 text-center">
                        No liability data. Connect your ELD and add fuel receipts for this quarter.
                      </td>
                    </tr>
                  ) : (
                    iftaResult.rows.map((row) => (
                      <tr
                        key={row.state_code}
                        className={`border-t border-white/5 text-soft-cloud/90 ${row.isAuditRisk ? 'bg-cyber-amber/5' : ''}`}
                      >
                        <td className="px-3 py-2 font-medium">{row.state_code}</td>
                        <td className="px-3 py-2 text-right">{row.miles.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        <td className="px-3 py-2 text-right">{row.gallons.toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={row.netOwed > 0 ? 'text-cyber-amber' : row.netOwed < 0 ? 'text-electric-teal' : 'text-soft-cloud/70'}>
                            {row.netOwed > 0 && `$${row.netOwed.toFixed(2)} owed`}
                            {row.netOwed < 0 && `$${Math.abs(row.netOwed).toFixed(2)} refund`}
                            {row.netOwed === 0 && '$0.00'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.isAuditRisk ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyber-amber/20 text-cyber-amber">
                              <AlertTriangle className="size-3.5" />
                              Audit Risk
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {iftaResult.rows.some((r) => r.isAuditRisk) && (
              <p className="text-xs text-cyber-amber/90 mt-3 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 shrink-0" />
                Audit Risk: state has mileage but no fuel receipts. Add receipts or confirm data to reduce audit exposure.
              </p>
            )}
          </div>
        </section>

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
          {updateError && (
            <div className="mx-4 mb-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
              {updateError}
            </div>
          )}

          <div className="px-5 pb-5">
            <h3 className="text-sm font-medium text-soft-cloud/70 mb-3">Receipt history</h3>
            {receipts.length === 0 ? (
              <p className="text-soft-cloud/50 text-sm py-4">No receipts for this quarter yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-midnight-ink/80 text-soft-cloud/70 text-left">
                      <th className="px-3 py-3 font-medium w-24">Preview</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">State</th>
                      <th className="px-3 py-3 font-medium">Gallons</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium text-right min-w-[8.5rem]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => {
                      const isScanning = scanningId === r.id;
                      const isEditing =
                        editingCell?.id === r.id && editingCell?.field;
                      const needsReview = r.status === 'pending' || r.status === 'processed';
                      return (
                        <tr
                          key={r.id}
                          className="border-t border-white/5 text-soft-cloud/90 hover:bg-white/[0.02]"
                        >
                          <td className="px-3 py-2 align-middle">
                            {r.file_url ? (
                              demoMode ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReceiptViewer({
                                      url: r.file_url!,
                                      vendor: r.vendor ?? null,
                                      amount: r.amount ?? null,
                                      state: r.state,
                                      gallons: r.gallons,
                                      fuel_type: r.fuel_type ?? null,
                                      date: r.receipt_date,
                                    })
                                  }
                                  className="block w-16 h-12 rounded-lg border border-white/10 bg-midnight-ink overflow-hidden focus:ring-2 focus:ring-cyber-amber focus:outline-none"
                                >
                                  <img
                                    src={r.file_url}
                                    alt="Receipt thumbnail"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : (
                                <a
                                  href={r.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-16 h-12 rounded-lg border border-white/10 bg-midnight-ink overflow-hidden focus:ring-2 focus:ring-cyber-amber focus:outline-none"
                                >
                                  <img
                                    src={r.file_url}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              )
                            ) : (
                              <div className="w-16 h-12 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                                <ImageIcon className="size-5 text-soft-cloud/40" />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {isEditing && editingCell?.field === 'receipt_date' ? (
                              <input
                                ref={(el) => {
                                  if (editingCell?.field === 'receipt_date') inputRef.current = el;
                                }}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                placeholder="YYYY-MM-DD"
                                className="w-32 bg-midnight-ink border border-cyber-amber/50 rounded px-2 py-1 text-soft-cloud focus:outline-none focus:ring-1 focus:ring-cyber-amber"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(r.id, 'receipt_date', r.receipt_date)}
                                className="text-left w-full min-w-[6rem] px-1 py-0.5 rounded hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyber-amber"
                              >
                                {r.receipt_date ?? '—'}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {isEditing && editingCell?.field === 'state' ? (
                              <input
                                ref={(el) => {
                                  if (editingCell?.field === 'state') inputRef.current = el;
                                }}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value.slice(0, 2).toUpperCase())}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                placeholder="XX"
                                maxLength={2}
                                className="w-14 bg-midnight-ink border border-cyber-amber/50 rounded px-2 py-1 text-soft-cloud uppercase focus:outline-none focus:ring-1 focus:ring-cyber-amber"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(r.id, 'state', r.state)}
                                className="text-left w-full min-w-[2.5rem] px-1 py-0.5 rounded hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyber-amber"
                              >
                                {r.state ?? '—'}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {isEditing && editingCell?.field === 'gallons' ? (
                              <input
                                ref={(el) => {
                                  if (editingCell?.field === 'gallons') inputRef.current = el;
                                }}
                                type="number"
                                step="0.1"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-20 bg-midnight-ink border border-cyber-amber/50 rounded px-2 py-1 text-soft-cloud focus:outline-none focus:ring-1 focus:ring-cyber-amber"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(r.id, 'gallons', r.gallons)}
                                className="text-left w-full min-w-[3rem] px-1 py-0.5 rounded hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyber-amber"
                              >
                                {r.gallons != null ? r.gallons.toFixed(1) : '—'}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {isScanning ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyber-amber/20 text-cyber-amber">
                                <Loader2 className="size-3.5 animate-spin" />
                                Scanning…
                              </span>
                            ) : r.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-electric-teal/20 text-electric-teal">
                                <CheckCircle2 className="size-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-cyber-amber/20 text-cyber-amber">
                                Needs Review
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              {demoMode && r.file_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReceiptViewer({
                                      url: r.file_url!,
                                      vendor: r.vendor ?? null,
                                      amount: r.amount ?? null,
                                      state: r.state,
                                      gallons: r.gallons,
                                      fuel_type: r.fuel_type ?? null,
                                      date: r.receipt_date,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber text-xs font-medium hover:bg-cyber-amber/20 transition-colors"
                                >
                                  <FileText className="size-3.5" />
                                  View Receipt
                                </button>
                              )}
                              {r.status !== 'verified' && (r.status === 'processed' || r.status === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(r.id)}
                                  disabled={!!approvingId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-electric-teal/20 text-electric-teal text-xs font-medium hover:bg-electric-teal/30 disabled:opacity-50 transition-colors"
                                >
                                  {approvingId === r.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="size-3.5" />
                                  )}
                                  Approve
                                </button>
                              )}
                            </div>
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

      {/* Demo: full-screen receipt preview (image placeholder / mock PDF chrome) */}
      {receiptViewer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-label="Receipt preview"
          onClick={() => setReceiptViewer(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-xl border border-white/15 bg-card shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-midnight-ink/90 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileArchive className="size-5 shrink-0 text-cyber-amber" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-soft-cloud truncate">Fuel receipt (demo)</p>
                  <p className="text-xs text-soft-cloud/60 truncate">
                    {receiptViewer.vendor ?? 'Receipt'} · PDF preview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptViewer(null)}
                className="shrink-0 rounded-lg p-2 text-soft-cloud/70 hover:bg-white/10 hover:text-soft-cloud"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#0d1117]">
              <div className="border-b border-dashed border-white/10 px-4 py-2 text-center">
                <p className="text-[10px] uppercase tracking-widest text-soft-cloud/45">Mock document — not a real PDF</p>
              </div>
              <div className="flex justify-center bg-gradient-to-b from-midnight-ink to-[#0a0f18] p-4">
                <img
                  src={receiptViewer.url}
                  alt="Receipt"
                  className="max-h-[min(70vh,520px)] w-auto max-w-full rounded-lg border border-white/10 object-contain shadow-lg"
                />
              </div>
              <div className="space-y-1 border-t border-white/10 px-4 py-4 text-sm text-soft-cloud/85">
                {receiptViewer.date && (
                  <p>
                    <span className="text-soft-cloud/50">Date:</span> {receiptViewer.date}
                  </p>
                )}
                {receiptViewer.state && (
                  <p>
                    <span className="text-soft-cloud/50">State:</span> {receiptViewer.state}
                  </p>
                )}
                {receiptViewer.gallons != null && (
                  <p>
                    <span className="text-soft-cloud/50">Gallons:</span> {receiptViewer.gallons.toFixed(1)}
                  </p>
                )}
                {receiptViewer.fuel_type && (
                  <p>
                    <span className="text-soft-cloud/50">Fuel:</span> {receiptViewer.fuel_type}
                  </p>
                )}
                {receiptViewer.amount != null && (
                  <p>
                    <span className="text-soft-cloud/50">Amount:</span>{' '}
                    {receiptViewer.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </p>
                )}
                {receiptViewer.vendor && (
                  <p>
                    <span className="text-soft-cloud/50">Vendor:</span> {receiptViewer.vendor}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

  return (
    <UpgradeOverlay hasAccess={iftaEnabled} title="IFTA Scanner">
      {content}
    </UpgradeOverlay>
  );
}
