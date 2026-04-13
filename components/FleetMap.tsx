'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';
const POLL_MS = 60 * 1000;
const TRAFFIC_LAYER_ID = 'vantag-traffic-layer';
const TRAFFIC_SOURCE_ID = 'vantag-traffic-source';
const LATE_ALERT_SPEED_MAX_MPH = 25; // Moving but slow = likely in heavy traffic (red zone)

export type FleetMapLocation = {
  id: string;
  lat: number;
  lng: number;
  vehicleName: string;
  driverName: string;
  speed: number | null;
  status: 'Moving' | 'Stationary';
  eta?: string | null;
  orgId?: string;
  orgName?: string;
};

/** Active load stops (pickup/delivery) shown alongside ELD positions. */
export type FleetStopOverlay = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  stopType: 'pickup' | 'delivery';
};

type FleetMapProps = {
  accessToken: string;
  /** When set, fetches locations for this org only (Dispatchers see all trucks in their org). */
  organizationId?: string | null;
  initialLocations?: FleetMapLocation[];
  /** Geocoded load stops; rendered as square markers (distinct from truck pins). */
  stopOverlays?: FleetStopOverlay[];
  /** Unauthenticated demo: no polling / API; pins come only from `initialLocations`. */
  sandboxMode?: boolean;
  height?: string;
  className?: string;
};

function isInHeavyTraffic(loc: FleetMapLocation): boolean {
  const speed = loc.speed ?? 0;
  return loc.status === 'Moving' && speed > 5 && speed < LATE_ALERT_SPEED_MAX_MPH;
}

export function FleetMap({
  accessToken,
  organizationId,
  initialLocations = [],
  stopOverlays = [],
  sandboxMode = false,
  height = '480px',
  className = '',
}: FleetMapProps) {
  const [locations, setLocations] = useState<FleetMapLocation[]>(initialLocations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [tokenRejected, setTokenRejected] = useState<boolean | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [trafficOn, setTrafficOn] = useState(false);
  const [trafficUnavailable, setTrafficUnavailable] = useState(false);
  const mapRef = useRef<MapboxMap | null>(null);
  const trafficAddedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!accessToken) {
      setTokenRejected(null);
      return;
    }
    setTokenRejected(null);
    const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${encodeURIComponent(accessToken)}`;
    fetch(styleUrl)
      .then((res) => {
        if (res.status === 401 || res.status === 403) setTokenRejected(true);
        else if (res.ok) setTokenRejected(false);
        else setTokenRejected(true);
      })
      .catch(() => setTokenRejected(true));
  }, [accessToken, retryKey]);

  const handleMapError = useCallback((e: { error?: { message?: string; sourceId?: string } }) => {
    const msg = e.error?.message ?? '';
    const sourceId = e.error?.sourceId;
    const isAuthError = msg.includes('401') || msg.includes('403') || msg.includes('Forbidden') || msg.toLowerCase().includes('unauthorized');
    if (isAuthError && (sourceId === TRAFFIC_SOURCE_ID || (Date.now() - trafficAddedAtRef.current < 10000))) {
      setTrafficUnavailable(true);
      return;
    }
    if (isAuthError) setTokenRejected(true);
    setMapLoadError(msg || 'Map failed to load');
  }, []);

  const fetchLocations = useCallback(async () => {
    if (sandboxMode) return;
    setLoading(true);
    setError(null);
    try {
      const url = organizationId
        ? `/api/fleet/locations?org_id=${encodeURIComponent(organizationId)}`
        : '/api/fleet/locations';
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to load locations');
        return;
      }
      const raw = Array.isArray(data.locations) ? data.locations : [];
      setLocations(
        raw.filter(
          (loc: unknown) =>
            loc &&
            typeof loc === 'object' &&
            typeof (loc as FleetMapLocation).id === 'string' &&
            Number.isFinite((loc as FleetMapLocation).lat) &&
            Number.isFinite((loc as FleetMapLocation).lng)
        ) as FleetMapLocation[]
      );
    } catch {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [organizationId, sandboxMode]);

  useEffect(() => {
    if (sandboxMode) {
      setLocations(initialLocations);
      setLoading(false);
      setError(null);
      return;
    }
    fetchLocations();
  }, [fetchLocations, sandboxMode, initialLocations]);

  useEffect(() => {
    if (sandboxMode) return;
    const t = setInterval(fetchLocations, POLL_MS);
    return () => clearInterval(t);
  }, [fetchLocations, sandboxMode]);

  const handleMapLoad = useCallback((e: { target: MapboxMap }) => {
    const map = e.target;
    mapRef.current = map;
    setMapLoadError(null);
    map.on('error', handleMapError);
    // Traffic layer is added only when user toggles "Live Traffic" ON (see useEffect below).
    // Not adding it on load avoids 401 from mapbox.mapbox-traffic-v1, which often requires extra scope/plan.
  }, [handleMapError]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (trafficOn) {
      if (!map.getSource(TRAFFIC_SOURCE_ID)) {
        trafficAddedAtRef.current = Date.now();
        setTrafficUnavailable(false);
        try {
          map.addSource(TRAFFIC_SOURCE_ID, {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-traffic-v1',
          });
          const beforeId = map.getLayer('road-label-primary') ? 'road-label-primary' : undefined;
          map.addLayer(
            {
              id: TRAFFIC_LAYER_ID,
              type: 'line',
              source: TRAFFIC_SOURCE_ID,
              'source-layer': 'traffic',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': [
                  'match', ['get', 'congestion'],
                  'heavy', '#ef4444', 'severe', '#dc2626', 'moderate', '#eab308', 'low', '#22c55e',
                  'rgba(0,0,0,0.1)',
                ],
                'line-width': 2,
                'line-opacity': 0.8,
              },
            },
            beforeId
          );
          map.setLayoutProperty(TRAFFIC_LAYER_ID, 'visibility', 'visible');
        } catch {
          setTrafficUnavailable(true);
        }
      } else {
        if (map.getLayer(TRAFFIC_LAYER_ID)) {
          map.setLayoutProperty(TRAFFIC_LAYER_ID, 'visibility', 'visible');
        }
      }
    } else {
      if (map.getLayer(TRAFFIC_LAYER_ID)) {
        map.setLayoutProperty(TRAFFIC_LAYER_ID, 'visibility', 'none');
      }
    }
  }, [trafficOn]);

  const selected = locations.find((l) => l && l.id === selectedId);
  const hovered = locations.find((l) => l && l.id === hoveredId);
  const overlayPoints = (stopOverlays ?? []).filter(
    (o) => o && Number.isFinite(o.lat) && Number.isFinite(o.lng)
  );
  const truckPoints = locations.filter((l) => l && Number.isFinite(l.lat) && Number.isFinite(l.lng));
  const allPoints = [
    ...truckPoints.map((l) => ({ lat: l.lat, lng: l.lng })),
    ...overlayPoints.map((o) => ({ lat: o.lat, lng: o.lng })),
  ];
  const hasCoords = allPoints.length > 0;
  const centerLng = hasCoords
    ? allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length
    : -98;
  const centerLat = hasCoords
    ? allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length
    : 39;

  const mapHeight = height || '480px';
  const effectiveHeight = mapHeight === '100%' ? '100%' : mapHeight;

  if (!accessToken) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-card flex flex-col items-center justify-center gap-2 text-soft-cloud/60 text-center px-4 ${className}`}
        style={{ height: effectiveHeight, minHeight: 400 }}
      >
        <p className="text-sm">Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.</p>
        <p className="text-xs text-soft-cloud/50 max-w-md">
          If the map is blank with a token set, ensure vantagfleet.com (and localhost for dev) is allowed in your Mapbox token URL restrictions.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl border border-white/10 bg-card overflow-hidden ${className}`}
      style={{ minHeight: mapHeight === '100%' ? 400 : undefined, height: effectiveHeight }}
    >
      {loading && locations.length === 0 && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-midnight-ink/80 text-soft-cloud"
          style={{ height: effectiveHeight, minHeight: 400 }}
        >
          <span className="text-sm">Loading map…</span>
        </div>
      )}
      {error && locations.length === 0 && (
        <div className="absolute top-3 left-3 right-3 z-20 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm p-3 text-center">
          {error} — Map centered on US.
        </div>
      )}

      {tokenRejected === true && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-midnight-ink/95 p-6 text-center rounded-xl overflow-auto">
          <p className="text-soft-cloud font-medium mb-2">Mapbox is rejecting your token (401)</p>
          <p className="text-xs text-soft-cloud/60 mb-3">
            Token in use: <code className="bg-white/10 px-1 rounded">{accessToken ? `${accessToken.slice(0, 7)}…${accessToken.slice(-4)}` : '(none)'}</code>
            {accessToken?.startsWith('sk.') && (
              <span className="block mt-1 text-amber-400">This is a secret token. The map must use a public token (pk.) in the browser.</span>
            )}
          </p>
          <p className="text-sm text-soft-cloud/70 max-w-md mb-3">
            In <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-cyber-amber hover:underline">Mapbox → Access tokens</a>, use the <strong>Default public token</strong> (starts with <code className="bg-white/10 px-1 rounded">pk.</code>). Do not use a secret token (<code className="bg-white/10 px-1 rounded">sk.</code>) — it will always return 401 in the browser. Copy the public token into <code className="bg-white/10 px-1 rounded">.env.local</code> as <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ...</code>, restart the dev server, then click Retry.
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="px-4 py-2 rounded-lg bg-cyber-amber text-midnight-ink font-medium text-sm hover:opacity-90 mb-4"
          >
            Retry
          </button>
          <a
            href="https://docs.mapbox.com/help/faq/what-is-the-difference-between-a-public-token-and-a-secret-token/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-amber hover:underline font-medium text-sm"
          >
            Public vs secret token (Mapbox) →
          </a>
        </div>
      )}

      {tokenRejected === false && mapLoadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-midnight-ink/95 p-6 text-center rounded-xl">
          <p className="text-soft-cloud font-medium mb-1">Map could not load</p>
          <p className="text-sm text-soft-cloud/70 max-w-md">{mapLoadError}</p>
        </div>
      )}

      {/* Don't render the Map when token is rejected to avoid repeated 403s */}
      {tokenRejected === true ? null : (
        <>
      {/* Live Traffic toggle */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setTrafficOn((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors ${
            trafficOn
              ? 'bg-cyber-amber text-midnight-ink'
              : 'bg-midnight-ink/90 text-soft-cloud border border-white/20 hover:bg-midnight-ink'
          }`}
        >
          Live Traffic {trafficOn ? 'ON' : 'OFF'}
        </button>
        {trafficUnavailable && (
          <span className="text-xs text-amber-400/90 bg-midnight-ink/90 px-2 py-1 rounded">Traffic layer unavailable with this token</span>
        )}
      </div>

      <Map
        mapboxAccessToken={accessToken}
        initialViewState={{
          longitude: Number(centerLng),
          latitude: Number(centerLat),
          zoom: allPoints.length <= 1 ? 4 : 5,
        }}
        style={{ width: '100%', height: effectiveHeight, minHeight: 400 }}
        mapStyle={MAPBOX_STYLE}
        onLoad={handleMapLoad}
      >
        {overlayPoints.map((stop) => (
          <Marker key={`stop-${stop.id}`} longitude={stop.lng} latitude={stop.lat} anchor="center">
            <div className="cursor-default" title={stop.label}>
              {stop.stopType === 'pickup' ? (
                <span className="block size-4 rounded-full bg-green-500 border border-black/30 shadow-md ring-2 ring-white/40" />
              ) : (
                <span className="block size-4 rounded-sm bg-blue-500 border border-black/30 shadow-md ring-2 ring-white/40" />
              )}
            </div>
          </Marker>
        ))}
        {locations.filter((loc) => loc && loc.id && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)).map((loc) => {
          const lateAlert = trafficOn && isInHeavyTraffic(loc);
          return (
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
                className="cursor-pointer transition-transform hover:scale-110 relative"
                title={`${loc.driverName}${loc.eta ? ` · ETA ${loc.eta}` : ''}`}
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {lateAlert && (
                  <span className="absolute inset-0 rounded-full bg-cyber-amber/60 animate-ping" style={{ animationDuration: '1.5s' }} />
                )}
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`drop-shadow-md relative ${lateAlert ? 'text-cyber-amber' : ''}`}
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill={lateAlert ? '#F59E0B' : loc.status === 'Moving' ? '#F59E0B' : '#6B7280'}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1"
                  />
                  <circle cx="12" cy="9" r="2.5" fill="#0f172a" />
                </svg>
              </div>
            </Marker>
          );
        })}
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
              {selected.eta && (
                <p className="text-sm text-midnight-ink/80">ETA: {selected.eta}</p>
              )}
              {selected.orgName && (
                <p className="text-xs text-midnight-ink/60 mt-1">Org: {selected.orgName}</p>
              )}
            </div>
          </Popup>
        )}
        {/* Hover tooltip: Driver name + ETA at truck */}
        {hovered && !selectedId && (
          <Popup
            longitude={hovered.lng}
            latitude={hovered.lat}
            anchor="top"
            closeButton={false}
            className="fleet-map-popup !pb-2"
          >
            <div className="min-w-[160px] text-left pointer-events-none">
              <p className="font-medium text-midnight-ink">{hovered.driverName}</p>
              <p className="text-xs text-midnight-ink/80 mt-0.5">
                ETA: {hovered.eta ?? '—'}
              </p>
            </div>
          </Popup>
        )}
      </Map>
        </>
      )}
    </div>
  );
}
