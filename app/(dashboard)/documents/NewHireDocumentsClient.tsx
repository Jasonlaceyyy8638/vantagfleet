'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveDriverDocument } from '@/app/actions/driver-documents';
import { Loader2, FileText, User, Check, X } from 'lucide-react';

type Driver = { id: string; name: string };

type DriverDoc = {
  id: string;
  driver_id: string;
  document_type: string;
  file_url: string;
  expiry_date: string | null;
};

export function NewHireDocumentsClient({
  orgId,
  drivers,
  initialDocs = [],
}: {
  orgId: string;
  drivers: Driver[];
  initialDocs: DriverDoc[];
}) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id ?? '');
  const [docs, setDocs] = useState<DriverDoc[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<{ name: string; type: string; expiry: string | null }[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedDriverId || acceptedFiles.length === 0) return;
      setError(null);
      setLastResults([]);
      setUploading(true);
      const results: { name: string; type: string; expiry: string | null }[] = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setUploadProgress(`AI is identifying: ${file.name} (${i + 1}/${acceptedFiles.length})`);
        const formData = new FormData();
        formData.set('file', file);
        const result = await saveDriverDocument(orgId, selectedDriverId, formData);
        if (result.ok) {
          setDocs((prev) => [
            ...prev,
            {
              id: result.id,
              driver_id: selectedDriverId,
              document_type: result.documentType,
              file_url: '',
              expiry_date: result.expiryDate,
            },
          ]);
          results.push({
            name: file.name,
            type: result.documentType,
            expiry: result.expiryDate,
          });
        } else {
          setError((e) => (e ? `${e}; ${result.error}` : result.error));
        }
      }
      setLastResults(results);
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
      <div className="rounded-xl border border-[#30363d] bg-card p-5">
        <label className="block text-sm font-medium text-cloud-dancer/80 mb-2">Select driver</label>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            disabled={uploading}
            className="px-3 py-2 rounded-lg bg-deep-ink border border-[#30363d] text-cloud-dancer text-sm"
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
          <span className="text-cloud-dancer/50 text-sm flex items-center gap-1">
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
            : 'border-[#30363d] bg-card hover:border-cloud-dancer/30 hover:bg-deep-ink'
        } ${uploading || !selectedDriverId ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-10 text-cyber-amber animate-spin" />
            <p className="text-cloud-dancer font-medium">{uploadProgress ?? 'Uploading...'}</p>
          </div>
        ) : (
          <>
            <FileText className="size-12 text-cloud-dancer/50 mx-auto mb-2" />
            <p className="text-cloud-dancer font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop documents here, or click to select'}
            </p>
            <p className="text-sm text-cloud-dancer/50 mt-1">
              Images only (JPEG, PNG, WebP). AI will identify COI, IFTA, registration, etc.
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

      {lastResults.length > 0 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
          <p className="text-sm font-medium text-emerald-300 mb-2">Uploaded and identified:</p>
          <ul className="space-y-1 text-sm text-cloud-dancer/90">
            {lastResults.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400 shrink-0" />
                {r.name} → <span className="text-cyber-amber">{r.type}</span>
                {r.expiry && <span className="text-cloud-dancer/60">expires {r.expiry}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-[#30363d] bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d]">
          <h2 className="font-semibold text-cloud-dancer">Documents on file</h2>
          <p className="text-xs text-cloud-dancer/50 mt-0.5">By driver</p>
        </div>
        <div className="divide-y divide-[#30363d]">
          {drivers.length === 0 ? (
            <div className="px-5 py-8 text-center text-cloud-dancer/50 text-sm">
              Add drivers from the Drivers page first.
            </div>
          ) : (
            drivers.map((driver) => {
              const list = docsForDriver(driver.id);
              return (
                <div key={driver.id} className="px-5 py-3 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-cloud-dancer w-40 truncate">{driver.name}</span>
                  {list.length === 0 ? (
                    <span className="text-cloud-dancer/50 text-sm">No documents yet</span>
                  ) : (
                    list.map((doc) => (
                      <span
                        key={doc.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-sm text-cloud-dancer/80"
                      >
                        {doc.document_type}
                        {doc.expiry_date && (
                          <span className="text-cloud-dancer/50">· {doc.expiry_date}</span>
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
