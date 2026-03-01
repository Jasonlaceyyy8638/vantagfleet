'use client';

import { useState, useRef } from 'react';
import { uploadDqDocument } from '@/app/actions/documents';
import { DocumentExpiryBadge } from '@/components/DocumentExpiryBadge';
import { Upload, Loader2, FileCheck, X } from 'lucide-react';

const SCAN_DELAY_MS = 1800;

/** Simulates AI/OCR extraction: tries to find a date in the filename, else returns 90 days from now. */
function simulateExtractExpiry(file: File): Promise<string> {
  return new Promise((resolve) => {
    const name = file.name.replace(/\.[^/.]+$/, '');
    const isoMatch = name.match(/(\d{4})-(\d{2})-(\d{2})/);
    const usMatch = name.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    let extracted = '';

    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      const year = y!.length === 4 ? y : `20${y}`;
      extracted = `${year}-${m}-${d}`;
    } else if (usMatch) {
      const [, m, d, y] = usMatch;
      const year = y!.length === 4 ? y! : `20${y}`;
      extracted = `${year}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
    }

    if (extracted && !Number.isNaN(Date.parse(extracted))) {
      setTimeout(() => resolve(extracted), SCAN_DELAY_MS);
      return;
    }

    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 90);
    setTimeout(() => resolve(fallback.toISOString().slice(0, 10)), SCAN_DELAY_MS);
  });
}

type Doc = { id: string; doc_type: string; file_path: string; expiry_date: string | null };

type DocumentUploadProps = {
  driverId: string;
  driverName: string;
  orgId: string;
  initialDocs?: Doc[];
  onDocAdded?: (doc: Doc) => void;
};

export function DocumentUpload({
  driverId,
  driverName,
  orgId,
  initialDocs = [],
  onDocAdded,
}: DocumentUploadProps) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedDate, setExtractedDate] = useState('');
  const [docType, setDocType] = useState('Medical Card');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) {
      setMessage('Please select an image file (e.g. JPG, PNG).');
      return;
    }
    setFile(f);
    setMessage('');
    setShowForm(true);
    setScanning(true);
    setExtractedDate('');
    try {
      const date = await simulateExtractExpiry(f);
      setExtractedDate(date);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !extractedDate) return;
    setSaving(true);
    setMessage('');
    const formData = new FormData();
    formData.set('file', file);
    formData.set('expiry_date', extractedDate);
    formData.set('doc_type', docType);
    const { error, doc } = await uploadDqDocument(orgId, driverId, formData);
    setSaving(false);
    if (error) {
      setMessage(error);
      return;
    }
    if (doc) {
      const newDoc: Doc = {
        id: doc.id,
        doc_type: doc.doc_type,
        file_path: '',
        expiry_date: doc.expiry_date,
      };
      setDocs((prev) => [...prev, newDoc]);
      onDocAdded?.(newDoc);
      setFile(null);
      setExtractedDate('');
      setShowForm(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setFile(null);
    setExtractedDate('');
    setScanning(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-soft-cloud">DQ Documents — {driverName}</h3>
      </div>

      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-midnight-ink border border-white/10"
            >
              <span className="text-sm text-soft-cloud/90">{d.doc_type}</span>
              <DocumentExpiryBadge expiryDate={d.expiry_date} />
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 text-soft-cloud/80 hover:bg-white/5 transition-colors"
      >
        <Upload className="size-5" />
        Upload document (image)
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-card p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-soft-cloud">Confirm extracted date</span>
            <button type="button" onClick={handleClose} className="p-1 rounded text-soft-cloud/60 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>
          {scanning ? (
            <div className="flex items-center gap-2 text-electric-teal text-sm">
              <Loader2 className="size-4 animate-spin" />
              Simulating AI scan…
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-soft-cloud/70 mb-1">Document type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
                >
                  <option>Medical Card</option>
                  <option>CDL</option>
                  <option>Insurance</option>
                  <option>IFTA</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-soft-cloud/70 mb-1">Expiry date (extracted)</label>
                <input
                  type="date"
                  value={extractedDate}
                  onChange={(e) => setExtractedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud text-sm"
                />
                <p className="text-xs text-soft-cloud/50 mt-1">Edit if needed. Badge: Safe &gt;30d, Yellow &lt;30d, Red expired.</p>
              </div>
              {message && <p className="text-sm text-red-400">{message}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={handleClose} className="px-3 py-2 rounded-lg border border-white/10 text-soft-cloud text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium text-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <FileCheck className="size-4" />}
                  Save document
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
