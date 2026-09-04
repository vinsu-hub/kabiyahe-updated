import { lazy, Suspense } from "react";
import { MapPin } from "lucide-react";
import { hasWebGL, mapLinkUrl } from "@/lib/geo";
import type { LBPoint, ZoneCircle } from "./LBMap";
import type { LatLng } from "@/lib/geo";

const LBMap = lazy(() => import("./LBMap"));

export type { LBPoint, ZoneCircle };

type Props = {
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
};

/** Lazy-loaded map with a graceful no-WebGL / loading fallback. */
export function MapView(props: Props) {
  const { points = [], height = 420 } = props;

  if (!hasWebGL()) {
    const href =
      points.length === 1
        ? mapLinkUrl(points[0].lat, points[0].lng)
        : "https://www.google.com/maps/place/Los+Ba%C3%B1os,+Laguna";
    return (
      <div className="lbmap lbmap-nowebgl" style={{ height }} role="region" aria-label={props.ariaLabel ?? "Map"}>
        <MapPin size={22} />
        <p>Map preview isn't available on this device.</p>
        <a className="link-accent" href={href} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="lbmap lbmap-loading" style={{ height }} aria-hidden="true" />}>
      <LBMap {...props} />
    </Suspense>
  );
}
