'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveComplianceCoi } from '@/app/actions/driver-documents';
import { Loader2, FileText, User, Check, X, AlertTriangle } from 'lucide-react';

type Driver = { id: string; name: string };

type CoiDoc = {
  id: string;
  driver_id: string;
  document_type: string;
  file_url: string;
  expiry_date: string | null;
  status: string | null;
  liability_limit: number | null;
  cargo_limit: number | null;
  non_compliant: boolean | null;
};

export function ComplianceClient({
  orgId,
  drivers,
  initialCoiDocs = [],
}: {
  orgId: string;
  drivers: Driver[];
  initialCoiDocs: CoiDoc[];
}) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id ?? '');
  const [docs, setDocs] = useState<CoiDoc[]>(initialCoiDocs);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    name: string;
    status: string;
    nonCompliant: boolean;
    policyExpirationDate: string | null;
    liabilityLimit: number | null;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedDriverId || acceptedFiles.length === 0) return;
      setError(null);
      setLastResult(null);
      setUploading(true);
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setUploadProgress(`Scanning COI: ${file.name} (${i + 1}/${acceptedFiles.length})`);
        const formData = new FormData();
        formData.set('file', file);
        const result = await saveComplianceCoi(orgId, selectedDriverId, formData);
        if (result.ok) {
          setDocs((prev) => [
            ...prev,
            {
              id: result.id,
              driver_id: selectedDriverId,
              document_type: 'COI',
              file_url: '',
              expiry_date: result.policyExpirationDate,
              status: result.status,
              liability_limit: result.liabilityLimit,
              cargo_limit: result.cargoLimit,
              non_compliant: result.nonCompliant,
            },
          ]);
          setLastResult({
            name: file.name,
            status: result.status,
            nonCompliant: result.nonCompliant,
            policyExpirationDate: result.policyExpirationDate,
            liabilityLimit: result.liabilityLimit,
          });
        } else {
          setError((e) => (e ? `${e}; ${result.error}` : result.error));
        }
      }
      setUploadProgress(null);
      setUploading(false);
    },
    [orgId, selectedDriverId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    disabled: uploading || !selectedDriverId || drivers.length === 0,
  });

  const docsForDriver = (driverId: string) => docs.filter((d) => d.driver_id === driverId);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-card p-5">
        <label className="block text-sm font-medium text-soft-cloud/80 mb-2">Select driver (for COI)</label>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            disabled={uploading}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-white/10 text-soft-cloud text-sm"
          >
            {drivers.length === 0 && (
              <option value="">No drivers — add one from Drivers</option>
            )}
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <span className="text-soft-cloud/50 text-sm flex items-center gap-1">
            <User className="size-4" />
            {drivers.length} driver{drivers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-cyber-amber bg-cyber-amber/10'
            : 'border-white/10 bg-card hover:border-soft-cloud/30'
        } ${uploading || !selectedDriverId ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-10 text-cyber-amber animate-spin" />
            <p className="text-soft-cloud font-medium">{uploadProgress ?? 'Uploading...'}</p>
            <p className="text-xs text-soft-cloud/60">AI is extracting Policy Expiration, Liability & Cargo limits</p>
          </div>
        ) : (
          <>
            <FileText className="size-12 text-soft-cloud/50 mx-auto mb-2" />
            <p className="text-soft-cloud font-medium">
              {isDragActive ? 'Drop COI here' : 'Drag & drop Certificate of Insurance (COI) here, or click to select'}
            </p>
            <p className="text-sm text-soft-cloud/60 mt-1">
              Images only (JPEG, PNG, WebP). We extract Policy Expiration Date, Liability Limit, and Cargo Limit.
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 flex items-center gap-2">
          <X className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {lastResult && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <p className="text-sm font-medium text-soft-cloud mb-2">Last upload: {lastResult.name}</p>
          <ul className="space-y-1 text-sm text-soft-cloud/90">
            {lastResult.policyExpirationDate && (
              <li>Policy expiration: {lastResult.policyExpirationDate}</li>
            )}
            {lastResult.liabilityLimit != null && (
              <li>Liability limit: ${lastResult.liabilityLimit.toLocaleString()}</li>
            )}
          </ul>
          <div className="flex flex-wrap gap-2 mt-2">
            {lastResult.status === 'expired' && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 px-2.5 py-1 font-medium text-red-400">
                <AlertTriangle className="size-4" />
                Expired
              </span>
            )}
            {lastResult.nonCompliant && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1 font-medium text-amber-400">
                <AlertTriangle className="size-4" />
                Non-Compliant (liability &lt; $1,000,000)
              </span>
            )}
            {lastResult.status !== 'expired' && !lastResult.nonCompliant && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-400">
                <Check className="size-4" />
                Compliant
              </span>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-soft-cloud">Certificates of Insurance (COI)</h2>
          <p className="text-xs text-soft-cloud/60 mt-0.5">By driver — Expired (red) or Non-Compliant when liability &lt; $1M</p>
        </div>
        <div className="divide-y divide-white/10">
          {drivers.length === 0 ? (
            <div className="px-5 py-8 text-center text-soft-cloud/50 text-sm">
              Add drivers from the Drivers page first.
            </div>
          ) : (
            drivers.map((driver) => {
              const list = docsForDriver(driver.id).filter((d) => d.document_type === 'COI');
              return (
                <div key={driver.id} className="px-5 py-3 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-soft-cloud w-40 truncate">{driver.name}</span>
                  {list.length === 0 ? (
                    <span className="text-soft-cloud/50 text-sm">No COI yet</span>
                  ) : (
                    list.map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1.5 flex-wrap"
                      >
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-sm text-soft-cloud/80">
                          COI
                          {doc.expiry_date && (
                            <span className="text-soft-cloud/50">· {doc.expiry_date}</span>
                          )}
                        </span>
                        {doc.status === 'expired' && (
                          <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                            <AlertTriangle className="size-3.5" />
                            Expired
                          </span>
                        )}
                        {doc.non_compliant && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                            <AlertTriangle className="size-3.5" />
                            Non-Compliant
                          </span>
                        )}
                      </span>
                    ))
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
