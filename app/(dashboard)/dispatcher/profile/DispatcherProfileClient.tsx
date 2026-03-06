'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Phone, Radio, Loader2 } from 'lucide-react';
import { updateProfilePhone, updateDispatcherStatus, uploadProfileImage, type DispatcherStatus } from '@/app/actions/profile';

type Props = {
  orgId: string;
  fullName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  dispatcherStatus: DispatcherStatus | null;
};

const STATUS_OPTIONS: { value: DispatcherStatus; label: string }[] = [
  { value: 'Available', label: 'Available' },
  { value: 'On Break', label: 'On Break' },
  { value: 'Off Duty', label: 'Off Duty' },
];

export function DispatcherProfileClient({
  orgId,
  fullName,
  phone: initialPhone,
  profileImageUrl: initialImageUrl,
  dispatcherStatus: initialStatus,
}: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(initialImageUrl);
  const [dispatcherStatus, setDispatcherStatus] = useState<DispatcherStatus | null>(initialStatus);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    const res = await updateProfilePhone(orgId, phone.trim() || null);
    setSavingPhone(false);
    if (res.ok) router.refresh();
  };

  const handleStatusChange = async (status: DispatcherStatus | null) => {
    setDispatcherStatus(status);
    setSavingStatus(true);
    const res = await updateDispatcherStatus(orgId, status);
    setSavingStatus(false);
    if (res.ok) router.refresh();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.set('file', file);
    const res = await uploadProfileImage(orgId, formData);
    setUploadingPhoto(false);
    if (res.ok) {
      setProfileImageUrl(res.url);
      router.refresh();
    } else {
      setPhotoError(res.error);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-soft-cloud">Dispatcher Profile</h1>

      {/* Headshot */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4 flex items-center gap-2">
          <Camera className="size-5 text-cyber-amber" />
          Professional headshot
        </h2>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-midnight-ink border border-white/10 shrink-0">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-soft-cloud/50">
                <Camera className="size-10" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-amber/20 text-cyber-amber font-medium text-sm cursor-pointer hover:bg-cyber-amber/30 transition-colors">
              <Camera className="size-4" />
              {uploadingPhoto ? 'Uploading…' : 'Upload headshot'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploadingPhoto}
                onChange={handlePhotoChange}
              />
            </label>
            {photoError && <p className="text-sm text-red-400 mt-2">{photoError}</p>}
          </div>
        </div>
      </section>

      {/* Direct extension / dispatch phone */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4 flex items-center gap-2">
          <Phone className="size-5 text-cyber-amber" />
          Direct extension / dispatch phone
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your direct line"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-midnight-ink border border-white/10 text-soft-cloud placeholder-soft-cloud/50"
          />
          <button
            type="button"
            onClick={handleSavePhone}
            disabled={savingPhone}
            className="px-4 py-2 rounded-lg bg-electric-teal text-midnight-ink font-medium text-sm hover:bg-electric-teal/90 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {savingPhone ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </section>

      {/* Status */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4 flex items-center gap-2">
          <Radio className="size-5 text-cyber-amber" />
          Status
        </h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(dispatcherStatus === opt.value ? null : opt.value)}
              disabled={savingStatus}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                dispatcherStatus === opt.value
                  ? 'bg-electric-teal text-midnight-ink'
                  : 'bg-white/10 text-soft-cloud/80 hover:bg-white/15'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-soft-cloud/50 mt-2">Drivers see this next to &quot;Call Dispatch&quot; on Roadside.</p>
      </section>
    </div>
  );
}
