'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_DARK = 'mapbox://styles/mapbox/dark-v11';
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

type FleetMapProps = {
  accessToken: string;
  /** When set, fetches locations for this org only (Dispatchers see all trucks in their org). */
  organizationId?: string | null;
  initialLocations?: FleetMapLocation[];
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
  height = '480px',
  className = '',
}: FleetMapProps) {
  const [locations, setLocations] = useState<FleetMapLocation[]>(initialLocations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trafficOn, setTrafficOn] = useState(false);
  const mapRef = useRef<MapboxMap | null>(null);

  const fetchLocations = useCallback(async () => {
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
  }, [organizationId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    const t = setInterval(fetchLocations, POLL_MS);
    return () => clearInterval(t);
  }, [fetchLocations]);

  const handleMapLoad = useCallback((e: { target: MapboxMap }) => {
    const map = e.target;
    mapRef.current = map;
    if (!map.getSource(TRAFFIC_SOURCE_ID)) {
      map.addSource(TRAFFIC_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1',
      });
      try {
        const beforeId = map.getLayer('road-label-primary') ? 'road-label-primary' : undefined;
        map.addLayer(
          {
            id: TRAFFIC_LAYER_ID,
            type: 'line',
            source: TRAFFIC_SOURCE_ID,
            'source-layer': 'traffic',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': [
                'match',
                ['get', 'congestion'],
                'heavy',
                '#ef4444',
                'severe',
                '#dc2626',
                'moderate',
                '#eab308',
                'low',
                '#22c55e',
                'rgba(0,0,0,0.1)',
              ],
              'line-width': 2,
              'line-opacity': 0.8,
            },
          },
          beforeId
        );
      } catch {
        // Layer might already exist or style differs
      }
      map.setLayoutProperty(TRAFFIC_LAYER_ID, 'visibility', 'none');
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(TRAFFIC_LAYER_ID)) return;
    map.setLayoutProperty(TRAFFIC_LAYER_ID, 'visibility', trafficOn ? 'visible' : 'none');
  }, [trafficOn]);

  const selected = locations.find((l) => l && l.id === selectedId);
  const hovered = locations.find((l) => l && l.id === hoveredId);
  const hasCoords = locations.some((l) => l && Number.isFinite(l.lat) && Number.isFinite(l.lng));
  const centerLng = hasCoords
    ? locations.reduce((s, l) => s + (l?.lng ?? 0), 0) / locations.length
    : -98;
  const centerLat = hasCoords
    ? locations.reduce((s, l) => s + (l?.lat ?? 0), 0) / locations.length
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

      {/* Live Traffic toggle */}
      <div className="absolute top-3 right-3 z-20">
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
      </div>

      <Map
        mapboxAccessToken={accessToken}
        initialViewState={{
          longitude: Number(centerLng),
          latitude: Number(centerLat),
          zoom: locations.length <= 1 ? 4 : 5,
        }}
        style={{ width: '100%', height: effectiveHeight, minHeight: 400 }}
        mapStyle={MAPBOX_DARK}
        onLoad={handleMapLoad}
      >
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
    </div>
  );
}
