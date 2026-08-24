/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
    __kabiyaheMapsLoader?: Promise<void>;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
const MAP_LOAD_MAX_ATTEMPTS = 2;

function loadMapScript(attempt = 0): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps requires a browser."));
  if (window.google?.maps) return Promise.resolve();
  if (window.__kabiyaheMapsLoader) return window.__kabiyaheMapsLoader;

  const origin = encodeURIComponent(window.location.origin);
  const src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry&origin=${origin}`;
  const existing = document.querySelector<HTMLScriptElement>(`script[src^="${MAPS_PROXY_URL}/maps/api/js"]`);

  window.__kabiyaheMapsLoader = new Promise<void>((resolve, reject) => {
    const script = existing || document.createElement("script");
    const finish = () => {
      if (window.google?.maps) resolve();
      else reject(new Error("Google Maps loaded without a usable API."));
    };
    const fail = () => {
      script.remove();
      window.__kabiyaheMapsLoader = undefined;
      if (attempt < MAP_LOAD_MAX_ATTEMPTS) {
        window.setTimeout(() => {
          loadMapScript(attempt + 1).then(resolve, reject);
        }, 650 * (attempt + 1));
        return;
      }
      reject(new Error("Failed to load Google Maps script after retries."));
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    if (window.google?.maps) finish();
  });

  return window.__kabiyaheMapsLoader;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");

  const init = usePersistFn(async () => {
    if (map.current) return;
    setMapStatus("loading");
    try {
      await loadMapScript();
    } catch {
      setMapStatus("error");
      return;
    }
    if (!mapContainer.current || map.current) {
      console.error("Map container not found");
      return;
    }
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      mapId: "DEMO_MAP_ID",
    });
    setMapStatus("ready");
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className={cn("relative w-full h-[500px] overflow-hidden", className)}>
      <div ref={mapContainer} className="w-full h-full" aria-label="Google Maps route map" />
      {mapStatus !== "ready" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#e9f0e4]/95 p-6 text-center">
          <div className="max-w-xs space-y-2">
            <p className="text-sm font-semibold text-[#21452f]">
              {mapStatus === "loading" ? "Loading route map…" : "Map temporarily unavailable"}
            </p>
            <p className="text-xs leading-relaxed text-[#687568]">
              {mapStatus === "loading" ? "Preparing verified route points." : "The route is still available in the itinerary list."}
            </p>
            {mapStatus === "error" && (
              <button
                type="button"
                className="mt-2 rounded-lg border border-[#21452f] px-3 py-2 text-xs font-semibold text-[#21452f] transition-transform active:scale-95"
                onClick={() => void init()}
              >
                Retry map
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
