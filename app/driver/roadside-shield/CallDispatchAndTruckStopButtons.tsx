'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Phone, Fuel } from 'lucide-react';

type DispatcherInfo = {
  fullName: string | null;
  profileImageUrl: string | null;
  status: string | null;
};

type Props = {
  dispatchPhone: string | null;
  dispatcher?: DispatcherInfo | null;
};

export function CallDispatchAndTruckStopButtons({ dispatchPhone, dispatcher }: Props) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const hasDispatchPhone = dispatchPhone != null && dispatchPhone.trim().length > 0;
  const telHref = hasDispatchPhone ? `tel:${dispatchPhone.trim()}` : undefined;

  const handleFindTruckStop = () => {
    setGeoError(null);
    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGeoError('Location not supported.');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps/search/truck+stops+with+diesel/@${latitude},${longitude},13z`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setGeoLoading(false);
      },
      () => {
        setGeoError('Could not get location. Enable location access and try again.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-white/10 bg-[#1e293b] p-4 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-3 mb-2">
          {dispatcher?.profileImageUrl ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-500/30 shrink-0">
              <Image
                src={dispatcher.profileImageUrl}
                alt={dispatcher.fullName ?? 'Dispatcher'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
          <div className="text-left">
            <h3 className="text-base font-semibold text-amber-400">Call Dispatch</h3>
            {dispatcher?.fullName && (
              <p className="text-xs text-[#94a3b8]">{dispatcher.fullName}</p>
            )}
            {dispatcher?.status && (
              <p className="text-xs text-emerald-400 mt-0.5">{dispatcher.status}</p>
            )}
          </div>
        </div>
        {hasDispatchPhone && telHref ? (
          <a
            href={telHref}
            className="roadside-btn w-full rounded-lg bg-[#f59e0b] text-black font-semibold px-4 py-3 flex items-center justify-center gap-2 no-underline"
          >
            <Phone className="size-5" />
            Call Dispatch
          </a>
        ) : (
          <p className="text-sm text-[#94a3b8]">No dispatch number configured.</p>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#1e293b] p-4 flex flex-col items-center justify-center text-center">
        <Fuel className="size-8 text-amber-400 mb-2" aria-hidden />
        <h3 className="text-base font-semibold text-amber-400 mb-1">Find Nearest Truck Stop</h3>
        <p className="text-xs text-[#94a3b8] mb-3">Uses your location for nearby diesel stops.</p>
        <button
          type="button"
          onClick={handleFindTruckStop}
          disabled={geoLoading}
          className="roadside-btn w-full rounded-lg bg-[#f59e0b] text-black font-semibold px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {geoLoading ? (
            'Getting location…'
          ) : (
            <>
              <Fuel className="size-5" />
              Find truck stops
            </>
          )}
        </button>
        {geoError && <p className="text-sm text-red-400 mt-2">{geoError}</p>}
      </div>
    </div>
  );
}
