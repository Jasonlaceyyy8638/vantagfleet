'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { Fuel, AlertCircle, Upload, Loader2, Check, ChevronRight } from 'lucide-react';
import { uploadIftaReceipt } from '@/app/actions/ifta-upload';

type Vehicle = { id: string; unit_number: string | null; vin: string | null };

type Props = {
  profileId: string;
  orgId: string;
  quarter: number;
  year: number;
  vehicles: Vehicle[];
};

export function MobileFuelUploadClient({ profileId, orgId, quarter, year, vehicles }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [breakdownSubmitting, setBreakdownSubmitting] = useState(false);
  const [breakdownSuccess, setBreakdownSuccess] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploadError(null);
      setUploadSuccess(false);
      setUploading(true);
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.set('file', file);
      const result = await uploadIftaReceipt(profileId, quarter, year, formData);
      setUploading(false);
      if (result.ok) setUploadSuccess(true);
      else setUploadError(result.error ?? 'Upload failed');
    },
    [profileId, quarter, year]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    disabled: uploading,
    maxFiles: 1,
  });

  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    const desc = description.trim();
    if (!desc) return;
    setBreakdownError(null);
    setBreakdownSuccess(false);
    setBreakdownSubmitting(true);
    const res = await fetch('/api/breakdown-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: desc,
        status: 'Pending',
        vehicle_id: vehicleId || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBreakdownSubmitting(false);
    if (res.ok) {
      setBreakdownSuccess(true);
      setDescription('');
      setVehicleId('');
    } else {
      setBreakdownError(data.error ?? 'Failed to report');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Fuel Receipt Upload */}
      <section className="rounded-2xl border border-white/10 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <Fuel className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Upload Fuel Receipt</h2>
        </div>
        <div className="p-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragActive ? 'border-cyber-amber bg-cyber-amber/10' : 'border-white/20 hover:border-cyber-amber/50'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 className="size-10 mx-auto text-cyber-amber animate-spin" />
            ) : (
              <Upload className="size-10 mx-auto text-soft-cloud/60 mb-2" />
            )}
            <p className="text-sm text-soft-cloud/80">
              {uploading ? 'Uploading…' : 'Tap or drop receipt photo (Q' + quarter + ' ' + year + ')'}
            </p>
          </div>
          {uploadSuccess && (
            <p className="mt-2 text-sm text-electric-teal flex items-center gap-1">
              <Check className="size-4" /> Receipt uploaded. It will be scanned for IFTA.
            </p>
          )}
          {uploadError && <p className="mt-2 text-sm text-red-400">{uploadError}</p>}
        </div>
      </section>

      {/* Report Breakdown */}
      <section className="rounded-2xl border border-white/10 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <AlertCircle className="size-5 text-cyber-amber" />
          <h2 className="font-semibold text-soft-cloud">Report Breakdown</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleReportBreakdown} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-soft-cloud/80 mb-1">What happened?</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Flat tire, engine issue"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/40"
              />
            </div>
            {vehicles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-soft-cloud/80 mb-1">Vehicle (optional)</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud"
                >
                  <option value="">— Select —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.unit_number || v.vin || v.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            )}
            {breakdownSuccess && (
              <p className="text-sm text-electric-teal flex items-center gap-1">
                <Check className="size-4" /> Reported. Dispatch has been notified.
              </p>
            )}
            {breakdownError && <p className="text-sm text-red-400">{breakdownError}</p>}
            <button
              type="submit"
              disabled={breakdownSubmitting}
              className="w-full py-3 rounded-xl bg-cyber-amber text-midnight-ink font-semibold hover:bg-cyber-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {breakdownSubmitting ? <Loader2 className="size-5 animate-spin" /> : null}
              Report Breakdown
            </button>
          </form>
        </div>
      </section>

      <p className="text-center text-sm text-soft-cloud/50">
        <Link href="/dashboard" className="text-cyber-amber hover:underline inline-flex items-center gap-1">
          Open full dashboard <ChevronRight className="size-4" />
        </Link>
      </p>
    </div>
  );
}
