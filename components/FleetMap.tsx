'use client';

import { useState, useEffect, useCallback } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_DARK = 'mapbox://styles/mapbox/dark-v11';
const POLL_MS = 60 * 1000;

export type FleetMapLocation = {
  id: string;
  lat: number;
  lng: number;
  vehicleName: string;
  driverName: string;
  speed: number | null;
  status: 'Moving' | 'Stationary';
  orgId?: string;
  orgName?: string;
};

type FleetMapProps = {
  /** Mapbox access token (use NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN). */
  accessToken: string;
  /** Optional initial locations (e.g. from server). */
  initialLocations?: FleetMapLocation[];
  /** Height of the map container. */
  height?: string;
  /** Optional class name for the wrapper. */
  className?: string;
};

export function FleetMap({
  accessToken,
  initialLocations = [],
  height = '480px',
  className = '',
}: FleetMapProps) {
  const [locations, setLocations] = useState<FleetMapLocation[]>(initialLocations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/motive/locations');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to load locations');
        return;
      }
      setLocations(Array.isArray(data.locations) ? data.locations : []);
    } catch {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    const t = setInterval(fetchLocations, POLL_MS);
    return () => clearInterval(t);
  }, [fetchLocations]);

  const selected = locations.find((l) => l.id === selectedId);
  const hasCoords = locations.some((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng));
  const centerLng = hasCoords
    ? locations.reduce((s, l) => s + l.lng, 0) / locations.length
    : -98;
  const centerLat = hasCoords
    ? locations.reduce((s, l) => s + l.lat, 0) / locations.length
    : 39;

  if (!accessToken) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-card flex items-center justify-center text-soft-cloud/60 ${className}`}
        style={{ height }}
      >
        <p className="text-sm">Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl border border-white/10 bg-card overflow-hidden ${className}`}>
      {loading && locations.length === 0 && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-midnight-ink/80 text-soft-cloud"
          style={{ height }}
        >
          <span className="text-sm">Loading map…</span>
        </div>
      )}
      {error && locations.length === 0 && (
        <div
          className="flex items-center justify-center text-amber-400 text-sm p-4"
          style={{ minHeight: height }}
        >
          {error}
        </div>
      )}
      <Map
        mapboxAccessToken={accessToken}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: locations.length <= 1 ? 4 : 5,
        }}
        style={{ width: '100%', height }}
        mapStyle={MAPBOX_DARK}
      >
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            longitude={loc.lng}
            latitude={loc.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedId(selectedId === loc.id ? null : loc.id);
            }}
          >
            <div
              className="cursor-pointer transition-transform hover:scale-110"
              title={`${loc.vehicleName} — ${loc.driverName}`}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill={loc.status === 'Moving' ? '#F59E0B' : '#6B7280'}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                />
                <circle cx="12" cy="9" r="2.5" fill="#0f172a" />
              </svg>
            </div>
          </Marker>
        ))}
        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="top"
            onClose={() => setSelectedId(null)}
            closeButton
            closeOnClick={false}
            className="fleet-map-popup"
          >
            <div className="min-w-[180px] text-left">
              <p className="font-semibold text-midnight-ink">{selected.vehicleName}</p>
              <p className="text-sm text-midnight-ink/80">Driver: {selected.driverName}</p>
              <p className="text-sm text-midnight-ink/80">
                Speed: {selected.speed != null ? `${selected.speed} mph` : '—'}
              </p>
              {selected.orgName && (
                <p className="text-xs text-midnight-ink/60 mt-1">Org: {selected.orgName}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
