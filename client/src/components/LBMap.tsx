import { useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker, Popup, NavigationControl, Source, Layer, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { ArrowRight, Navigation } from "lucide-react";
import { Link } from "wouter";
import {
  LB_CENTER, LB_DEFAULT_ZOOM, directionsUrl, mapLinkUrl, prefersReducedMotion, type LatLng,
} from "@/lib/geo";

// Raster basemap — OpenStreetMap standard tiles. Free, no API key, works on every
// device and renderer. (If traffic grows, swap for a keyed provider — see todo.md.)
const MAP_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export type LBPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  kind?: string;
  href?: string;
  sub?: string;
};

export type ZoneCircle = { center: LatLng; radiusKm: number; label: string; color?: string };

const KIND_COLOR: Record<string, string> = {
  Nature: "#0e543c", "Nature & Parks": "#0e543c",
  Food: "#d17b27", "Food & Restaurants": "#d17b27",
  Culture: "#94603c", "Culture & Heritage": "#94603c",
  Hotels: "#377b8c", "Hotels & Stays": "#377b8c", Accommodations: "#377b8c",
  Attractions: "#dba01c", Relaxation: "#dba01c",
  Event: "#6d2740", Sports: "#0e543c", Arts: "#dba01c", Community: "#d17b27",
  Passport: "#6d2740", Parking: "#377b8c",
};
const colorFor = (k?: string) => (k && KIND_COLOR[k]) || "#064a35";

function circlePolygon(center: LatLng, radiusKm: number, steps = 48) {
  const coords: [number, number][] = [];
  const dLat = radiusKm / 110.574;
  const dLng = radiusKm / (111.320 * Math.cos((center.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([center.lng + dLng * Math.cos(t), center.lat + dLat * Math.sin(t)]);
  }
  return coords;
}

function boundsOf(points: LBPoint[]) {
  const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ] as [[number, number], [number, number]];
}

export default function LBMap({
  points = [],
  zones = [],
  center,
  zoom,
  fitBounds = false,
  interactive = true,
  showUser = false,
  userCoords = null,
  height = 420,
  ariaLabel = "Map of Los Baños",
}: {
  points?: LBPoint[];
  zones?: ZoneCircle[];
  center?: LatLng;
  zoom?: number;
  fitBounds?: boolean;
  interactive?: boolean;
  showUser?: boolean;
  userCoords?: LatLng | null;
  height?: number;
  ariaLabel?: string;
}) {
  const mapRef = useRef<MapRef | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<LBPoint | null>(null);
  const reduce = prefersReducedMotion();

  // react-map-gl doesn't always catch container resizes (fonts/images settling,
  // layout shifts). Keep the canvas in sync explicitly.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { mapRef.current?.resize(); });
    ro.observe(el);
    const t = setTimeout(() => mapRef.current?.resize(), 300);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);

  const initial = useMemo(() => {
    const c = center ?? (points.length === 1 ? { lat: points[0].lat, lng: points[0].lng } : LB_CENTER);
    return { longitude: c.lng, latitude: c.lat, zoom: zoom ?? (points.length === 1 ? 15 : LB_DEFAULT_ZOOM) };
  }, [center, zoom, points]);

  const doFit = () => {
    const map = mapRef.current;
    if (!map || !fitBounds || points.length < 2) return;
    try {
      map.fitBounds(boundsOf(points), { padding: 48, maxZoom: 15, duration: reduce ? 0 : 400 });
    } catch { /* ignore */ }
  };
  useEffect(doFit, [fitBounds, points, reduce]);

  const zoneGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: zones.map((z, i) => ({
        type: "Feature" as const,
        properties: { color: z.color ?? "#064a35", label: z.label, i },
        geometry: { type: "Polygon" as const, coordinates: [circlePolygon(z.center, z.radiusKm)] },
      })),
    }),
    [zones],
  );

  return (
    <div className="lbmap" style={{ height }} role="region" aria-label={ariaLabel} ref={wrapRef}>
      <Map
        ref={mapRef}
        initialViewState={initial}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        interactive={interactive}
        dragRotate={false}
        touchZoomRotate={interactive}
        attributionControl={{ compact: true }}
        onClick={() => setSelected(null)}
        onLoad={e => { e.target.resize(); doFit(); }}
      >
        {interactive && <NavigationControl position="top-right" showCompass={false} />}

        {zones.length > 0 && (
          <Source id="lbmap-zones" type="geojson" data={zoneGeo}>
            <Layer id="lbmap-zones-fill" type="fill" paint={{ "fill-color": ["get", "color"], "fill-opacity": 0.14 }} />
            <Layer id="lbmap-zones-line" type="line" paint={{ "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.5 }} />
          </Source>
        )}
        {zones.map((z, i) => (
          <Marker key={`zone-${i}`} longitude={z.center.lng} latitude={z.center.lat} anchor="center">
            <span className="lbmap-zone-label">{z.label}</span>
          </Marker>
        ))}

        {points.map(p => (
          <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom">
            <button
              className="lbmap-pin"
              style={{ color: colorFor(p.kind) }}
              aria-label={p.name}
              onClick={e => { e.stopPropagation(); setSelected(p); }}
            >
              <svg viewBox="0 0 24 32" width="26" height="34" aria-hidden="true">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="currentColor" />
                <circle cx="12" cy="12" r="4.5" fill="#fffdf8" />
              </svg>
            </button>
          </Marker>
        ))}

        {showUser && userCoords && (
          <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="center">
            <span className="lbmap-user" aria-label="Your location" />
          </Marker>
        )}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            offset={30}
            closeButton
            closeOnClick={false}
            onClose={() => setSelected(null)}
            className="lbmap-popup"
          >
            <strong>{selected.name}</strong>
            {selected.sub && <span className="lbmap-popup-sub">{selected.sub}</span>}
            <div className="lbmap-popup-actions">
              {selected.href && (
                <Link href={selected.href} className="link-accent">View <ArrowRight size={13} /></Link>
              )}
              <a href={directionsUrl(selected.lat, selected.lng)} target="_blank" rel="noreferrer" className="link-accent">
                <Navigation size={13} /> Directions
              </a>
            </div>
          </Popup>
        )}
      </Map>

      <a
        className="lbmap-fallback-link"
        href={points.length === 1 ? mapLinkUrl(points[0].lat, points[0].lng) : "https://www.google.com/maps/place/Los+Ba%C3%B1os,+Laguna"}
        target="_blank"
        rel="noreferrer"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
