'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertTriangle, X, Camera, RotateCcw, Check, Loader2 } from 'lucide-react';

const INCIDENT_TYPES = ['DOT Inspection', 'Mechanical Breakdown', 'Accident', 'Citation'] as const;

export type IncidentReport = {
  id: string;
  incident_type: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
  created_at: string;
};

type Props = {
  onSuccess?: () => void;
};

export function ReportIncidentButton({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<string>(INCIDENT_TYPES[0]);
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        setMessage('Location not available.');
      }
    );
  }, []);

  useEffect(() => {
    if (open) {
      setMessage('');
      setSuccess(false);
      getLocation();
    }
  }, [open, getLocation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/driver/roadside-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_type: incidentType,
          notes: notes.trim() || undefined,
          latitude: lat,
          longitude: lng,
          photoBase64: photoDataUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'Failed to submit report.');
        return;
      }
      setSuccess(true);
      setNotes('');
      setPhotoDataUrl(null);
      setPhotoConfirmed(false);
      onSuccess?.();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="roadside-btn w-full rounded-lg border-2 border-red-500/60 bg-red-500/20 text-red-400 font-bold px-4 py-4 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
      >
        <AlertTriangle className="size-6" />
        Report Inspection/Incident
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
          role="dialog"
          aria-labelledby="report-incident-title"
        >
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0f172a] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f172a] z-10">
              <h2 id="report-incident-title" className="text-lg font-semibold text-white">
                Report Inspection/Incident
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Incident Type</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e293b] border border-white/10 text-white"
                  required
                >
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Photo (Inspection Report or Ticket)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!photoDataUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 text-amber-400 flex flex-col items-center gap-2"
                  >
                    <Camera className="size-8" />
                    <span>Take Photo or Choose Image</span>
                  </button>
                ) : photoConfirmed ? (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex items-center justify-between">
                    <span className="text-emerald-400 text-sm font-medium">Photo attached</span>
                    <button
                      type="button"
                      onClick={() => { setPhotoDataUrl(null); setPhotoConfirmed(false); fileInputRef.current?.click(); }}
                      className="text-amber-400 text-sm underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#1e293b]">
                    <img src={photoDataUrl} alt="Incident" className="w-full max-h-64 object-contain" />
                    <div className="flex gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 rounded-lg border border-white/20 text-[#cbd5e1] font-medium flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="size-4" /> Retake
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoConfirmed(true)}
                        className="flex-1 py-2 rounded-lg bg-amber-500 text-black font-medium flex items-center justify-center gap-2"
                      >
                        <Check className="size-4" /> Use Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What happened?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e293b] border border-white/10 text-white placeholder-[#64748b] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                <span>Location:</span>
                {lat != null && lng != null ? (
                  <span className="text-emerald-400">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                ) : (
                  <button type="button" onClick={getLocation} className="text-amber-400 underline">
                    Get GPS
                  </button>
                )}
              </div>

              {message && <p className="text-sm text-red-400">{message}</p>}
              {success && <p className="text-sm text-emerald-400 font-medium">Report sent to Dispatch.</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-white/20 text-[#cbd5e1] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-lg bg-red-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                  {submitting ? 'Sending…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
