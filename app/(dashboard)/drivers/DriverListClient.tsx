'use client';

import { createClient } from '@/lib/supabase/client';
import { ComplianceStatusBadge } from '@/components/ComplianceStatusBadge';
import { DocumentUpload } from '@/components/DocumentUpload';
import { scanDqFile } from '@/app/actions/scan-dq-file';
import { scanDq } from '@/app/actions/scan-dq';
import { useState, useRef } from 'react';
import { UserPlus, Loader2, FileText, ScanLine, Scan } from 'lucide-react';

type Driver = {
  id: string;
  name: string;
  license_number: string | null;
  license_state: string | null;
  med_card_expiry: string | null;
  clearinghouse_status: string | null;
};

type ComplianceDoc = {
  id: string;
  driver_id: string | null;
  doc_type: string;
  file_path: string;
  expiry_date: string | null;
};

export function DriverListClient({
  orgId,
  initialDrivers,
  initialComplianceDocs = [],
}: {
  orgId: string;
  initialDrivers: Driver[];
  initialComplianceDocs?: ComplianceDoc[];
}) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDoc[]>(initialComplianceDocs);
  const [showForm, setShowForm] = useState(false);
  const [docsDriverId, setDocsDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [medCardExpiry, setMedCardExpiry] = useState('');
  const [clearinghouseStatus, setClearinghouseStatus] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ expirationDate: string; name?: string; type?: string } | null>(null);
  const [smartScanLoading, setSmartScanLoading] = useState(false);
  const [smartScanError, setSmartScanError] = useState<string | null>(null);
  const [smartScanResult, setSmartScanResult] = useState<{ expirationDate: string; name?: string; type?: string } | null>(null);
  const smartScanInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const docsDriver = docsDriverId ? drivers.find((d) => d.id === docsDriverId) : null;
  const docsForDriver = (driverId: string) =>
    complianceDocs.filter((d) => d.driver_id === driverId);

  const handleAiScanDocument = async () => {
    if (!docsDriver || !scanFile) {
      setScanError('Select a photo first.');
      return;
    }
    setScanError(null);
    setScanResult(null);
    setScanLoading(true);
    try {
      const formData = new FormData();
      formData.set('file', scanFile);
      formData.set('driverId', docsDriver.id);
      const result = await scanDqFile(formData);
      if (!result.ok) {
        setScanError(result.error);
        return;
      }
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === docsDriver.id ? { ...d, med_card_expiry: result.expirationDate } : d
        )
      );
      setScanResult({
        expirationDate: result.expirationDate,
        name: result.name,
        type: result.type,
      });
      setScanFile(null);
    } catch {
      setScanError('Something went wrong. Try again.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleSmartScanClick = () => {
    setSmartScanError(null);
    setSmartScanResult(null);
    smartScanInputRef.current?.click();
  };

  const handleSmartScanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !docsDriver) return;
    if (!file.type.startsWith('image/')) {
      setSmartScanError('Please select an image (JPEG, PNG, or WebP).');
      return;
    }
    setSmartScanError(null);
    setSmartScanResult(null);
    setSmartScanLoading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('driverId', docsDriver.id);
      const result = await scanDq(formData);
      if (!result.ok) {
        setSmartScanError(result.error);
        return;
      }
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === docsDriver.id ? { ...d, med_card_expiry: result.expirationDate } : d
        )
      );
      setSmartScanResult({
        expirationDate: result.expirationDate,
        name: result.name,
        type: result.type,
      });
    } catch {
      setSmartScanError('Something went wrong. Try again.');
    } finally {
      setSmartScanLoading(false);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        org_id: orgId,
        name: name.trim(),
        license_number: licenseNumber.trim() || null,
        license_state: licenseState.trim() || null,
        med_card_expiry: medCardExpiry || null,
        clearinghouse_status: clearinghouseStatus.trim() || null,
      })
      .select('id, name, license_number, license_state, med_card_expiry, clearinghouse_status')
      .single();
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setDrivers((prev) => [...prev, data]);
    setName('');
    setLicenseNumber('');
    setLicenseState('');
    setMedCardExpiry('');
    setClearinghouseStatus('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-cloud-dancer/70 text-sm">{drivers.length} driver{drivers.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 text-deep-ink text-sm font-medium"
        >
          <UserPlus className="size-4" />
          Add driver
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddDriver}
          className="rounded-xl border border-[#30363d] bg-card p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-cloud-dancer">New driver</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="Driver full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Med card expiry</label>
              <input
                type="date"
                value={medCardExpiry}
                onChange={(e) => setMedCardExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">License number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">License state</label>
              <input
                type="text"
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="e.g. CA"
                maxLength={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Clearinghouse status</label>
              <input
                type="text"
                value={clearinghouseStatus}
                onChange={(e) => setClearinghouseStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm focus:ring-2 focus:ring-transformative-teal"
                placeholder="Optional"
              />
            </div>
          </div>
          {message && <p className="text-sm text-red-400">{message}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-[#30363d] text-cloud-dancer text-sm hover:bg-deep-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink text-sm font-medium"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Add driver
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        {drivers.length === 0 ? (
          <div className="px-5 py-10 text-center text-cloud-dancer/50 text-sm">
            No drivers yet. Add your first driver above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-card">
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">License</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">Med card expiry</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">Compliance status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-cloud-dancer/60 uppercase tracking-wider">DQ Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-deep-ink">
                  <td className="py-3 px-4 text-cloud-dancer font-medium">{d.name}</td>
                  <td className="py-3 px-4 text-cloud-dancer/80 text-sm">
                    {d.license_number && d.license_state
                      ? `${d.license_number} (${d.license_state})`
                      : d.license_number || '—'}
                  </td>
                  <td className="py-3 px-4 text-cloud-dancer/80 text-sm">
                    {d.med_card_expiry || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <ComplianceStatusBadge medCardExpiry={d.med_card_expiry} />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => setDocsDriverId(d.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/20 text-soft-cloud/80 hover:bg-white/10 text-sm"
                    >
                      <FileText className="size-4" />
                      Docs ({docsForDriver(d.id).length})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {docsDriverId && docsDriver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-label="DQ document upload"
          onClick={() => setDocsDriverId(null)}
        >
          <div
            className="bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setDocsDriverId(null)}
                className="text-soft-cloud/60 hover:text-soft-cloud p-1 rounded text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <ScanLine className="size-4" />
                AI Scan Document
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-cloud-dancer/70 mb-1">Photo of Medical Card or CDL</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setScanFile(f ?? null);
                      setScanError(null);
                      setScanResult(null);
                    }}
                    className="w-full text-sm text-cloud-dancer/80 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-amber-500/20 file:text-amber-400 file:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAiScanDocument}
                  disabled={scanLoading || !scanFile}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyber-amber hover:bg-cyber-amber/90 disabled:opacity-50 text-deep-ink text-sm font-medium"
                >
                  {scanLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Scanning for Expiration Date...
                    </>
                  ) : (
                    <>
                      <ScanLine className="size-4" />
                      AI Scan Document
                    </>
                  )}
                </button>
                {scanError && <p className="text-sm text-red-400">{scanError}</p>}
                {scanResult && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-300">
                    <p className="font-medium">Expiration date saved</p>
                    <p className="mt-1">Expiration Date: {scanResult.expirationDate}</p>
                    {scanResult.name && <p>Driver Name: {scanResult.name}</p>}
                    {scanResult.type && <p className="text-cloud-dancer/70">Document: {scanResult.type}</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <input
                ref={smartScanInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleSmartScanFileChange}
              />
              <button
                type="button"
                onClick={handleSmartScanClick}
                disabled={smartScanLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-400 text-sm font-medium"
              >
                {smartScanLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    AI is analyzing...
                  </>
                ) : (
                  <>
                    <Scan className="size-4" />
                    Smart Scan
                  </>
                )}
              </button>
              <span className="text-xs text-cloud-dancer/60">Upload Medical Card or CDL for AI extraction</span>
            </div>
            {smartScanError && <p className="mb-4 text-sm text-red-400">{smartScanError}</p>}
            {smartScanResult && (
              <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-300">
                <p className="font-medium">Compliance scan complete</p>
                <p className="mt-1">Expiration Date: {smartScanResult.expirationDate}</p>
                {smartScanResult.name && <p>Driver Name: {smartScanResult.name}</p>}
                {smartScanResult.type && <p className="text-cloud-dancer/70">Document: {smartScanResult.type}</p>}
                <p className="mt-1 text-amber-400/90">Status set to REVIEW_REQUIRED</p>
              </div>
            )}
            <DocumentUpload
              driverId={docsDriver.id}
              driverName={docsDriver.name}
              orgId={orgId}
              initialDocs={docsForDriver(docsDriver.id).map((d) => ({
                id: d.id,
                doc_type: d.doc_type,
                file_path: d.file_path,
                expiry_date: d.expiry_date,
              }))}
              onDocAdded={(doc) =>
                setComplianceDocs((prev) => [...prev, { ...doc, driver_id: docsDriver.id }])
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
