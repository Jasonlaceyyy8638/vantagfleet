'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Phone, Truck, ShieldCheck, Loader2 } from 'lucide-react';
import { updateProfilePhone, uploadProfileImage } from '@/app/actions/profile';

type Props = {
  profileId: string;
  orgId: string;
  fullName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  assignedTruckNumber: string | null;
  daysIncidentFree: number;
};

export function DriverProfileClient({
  profileId,
  orgId,
  fullName,
  phone: initialPhone,
  profileImageUrl: initialImageUrl,
  assignedTruckNumber,
  daysIncidentFree,
}: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(initialImageUrl);
  const [savingPhone, setSavingPhone] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    const res = await updateProfilePhone(orgId, phone.trim() || null);
    setSavingPhone(false);
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
      <h1 className="text-2xl font-bold text-soft-cloud">Driver Profile</h1>

      {/* Profile photo */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4 flex items-center gap-2">
          <Camera className="size-5 text-cyber-amber" />
          Profile photo
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
              {uploadingPhoto ? 'Uploading…' : 'Upload photo'}
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

      {/* Phone */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-4 flex items-center gap-2">
          <Phone className="size-5 text-cyber-amber" />
          Phone number
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
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

      {/* Assigned truck */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-2 flex items-center gap-2">
          <Truck className="size-5 text-cyber-amber" />
          Assigned truck
        </h2>
        <p className="text-soft-cloud/90">
          {assignedTruckNumber ?? '—'}
        </p>
        <p className="text-xs text-soft-cloud/50 mt-1">From your organization&apos;s fleet.</p>
      </section>

      {/* Safety stats */}
      <section className="rounded-xl border border-white/10 bg-card p-6">
        <h2 className="text-lg font-semibold text-soft-cloud mb-2 flex items-center gap-2">
          <ShieldCheck className="size-5 text-cyber-amber" />
          Safety
        </h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-electric-teal/20 text-electric-teal font-medium">
          <ShieldCheck className="size-5" />
          {daysIncidentFree} days incident free
        </div>
      </section>
    </div>
  );
}
