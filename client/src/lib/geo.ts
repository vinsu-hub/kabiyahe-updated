import { useCallback, useState } from "react";

export type LatLng = { lat: number; lng: number };

export const LB_CENTER: LatLng = { lat: 14.1699, lng: 121.2168 };
export const LB_DEFAULT_ZOOM = 12.5;

/** One-shot browser geolocation. Resolves null on denial / unsupported / timeout. */
export function getPosition(): Promise<LatLng | null> {
  return new Promise(resolve => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export type LocationStatus = "idle" | "prompting" | "granted" | "denied";

/** Opt-in location: call request() from a user gesture. Never auto-prompts. */
export function useUserLocation() {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const request = useCallback(async () => {
    setStatus("prompting");
    const pos = await getPosition();
    if (pos) { setCoords(pos); setStatus("granted"); }
    else setStatus("denied");
    return pos;
  }, []);
  return { coords, status, request };
}

/** Great-circle distance in km. Mirrors public.haversine_m() (which returns metres). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** True when a point sits within the Los Baños town + Makiling footprint (~7 km of the poblacion). */
export function isLosBanos(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  return distanceKm(LB_CENTER, { lat, lng }) <= 7;
}

/** Universal directions link — opens the visitor's default map app. No API key. */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** A plain "view this point on a map" link, used as the no-WebGL fallback. */
export function mapLinkUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

let webglOk: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglOk !== null) return webglOk;
  try {
    const c = document.createElement("canvas");
    webglOk = !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    webglOk = false;
  }
  return webglOk;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
