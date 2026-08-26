import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Car, Flag, MapPin, Navigation, Sparkles, WalletCards } from "lucide-react";
import { MapView } from "@/components/Map";
import { Link } from "wouter";
import { assetPath } from "@/lib/assets";

export type RoutePoint = {
  number: number;
  name: string;
  place: string;
  time: string;
  category: string;
  duration: string;
  image: string;
  slug: string;
  position: { lat: number; lng: number };
  overnight?: boolean;
};

export const LAGUNA_ROUTE_POINTS: RoutePoint[] = [
  { number: 1, name: "Pagsanjan Falls", place: "Pagsanjan, Laguna", time: "09:00 AM – 11:00 AM", category: "Nature", duration: "2 hrs", image: assetPath("kabiyahe-pagsanjan-falls_bd37de01.jpg"), slug: "pagsanjan-falls", position: { lat: 14.2737, lng: 121.4555 } },
  { number: 2, name: "Danielitos Home Kitchen", place: "Pagsanjan, Laguna", time: "12:00 PM – 01:00 PM", category: "Food", duration: "1 hr", image: assetPath("kabiyahe-bundles-sunset_99ff267e.jpg"), slug: "danielitos-home-kitchen", position: { lat: 14.2705, lng: 121.4551 } },
  { number: 3, name: "Majayjay Church", place: "Majayjay, Laguna", time: "02:00 PM – 03:00 PM", category: "Culture", duration: "1 hr", image: assetPath("kabiyahe-bundles-sunset_99ff267e.jpg"), slug: "majayjay-church", position: { lat: 14.1467, lng: 121.4721 } },
  { number: 4, name: "Los Baños Hot Springs", place: "Los Baños, Laguna", time: "04:00 PM – 06:00 PM", category: "Relaxation", duration: "2 hrs", image: assetPath("kabiyahe-hero-laguna_e334210c.jpg"), slug: "los-banos-hot-springs", position: { lat: 14.1692, lng: 121.2416 } },
  { number: 5, name: "Sol Y Viento Hotels and Resorts", place: "Pansol, Calamba, Laguna", time: "07:30 PM", category: "Stay", duration: "Overnight", image: assetPath("kabiyahe-calinaya-lake_96b9ff18.jpg"), slug: "sol-y-viento-hotels-and-resorts", position: { lat: 14.2059, lng: 121.1957 }, overnight: true },
];

export function RouteOverview({ points = LAGUNA_ROUTE_POINTS }: { points?: RoutePoint[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const routeBounds = useMemo(() => {
    if (!points.length) return { lat: 14.2, lng: 121.35 };
    return points[Math.floor(points.length / 2)].position;
  }, [points]);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setMapTypeId(mapType);
  }, [mapType]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setMapTypeId(mapType);
    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point.position));
    map.fitBounds(bounds, 54);
    overlaysRef.current.forEach(overlay => (overlay as any).setMap?.(null));
    overlaysRef.current = [];

    points.forEach(point => {
      const marker = new google.maps.Marker({ map, position: point.position, title: `${point.number}. ${point.name}`, label: { text: String(point.number), color: "#ffffff", fontWeight: "700" } });
      overlaysRef.current.push(marker as unknown as google.maps.MVCObject);
    });

    if (points.length > 1) {
      const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: true, polylineOptions: { strokeColor: "#2f9eaa", strokeOpacity: 0.92, strokeWeight: 5 } });
      const service = new google.maps.DirectionsService();
      service.route({ origin: points[0].position, destination: points[points.length - 1].position, waypoints: points.slice(1, -1).map(point => ({ location: point.position, stopover: true })), travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
        if (status === "OK" && result) renderer.setDirections(result);
      });
      overlaysRef.current.push(renderer as unknown as google.maps.MVCObject);
    }
  };

  return <section className="route-overview-shell">
    <div className="route-overview-map">
      <MapView className="route-google-map" initialCenter={routeBounds} initialZoom={11} onMapReady={handleMapReady} />
      <div className="route-map-toolbar" role="group" aria-label="Map type">
        <button className={mapType === "roadmap" ? "active" : ""} onClick={() => setMapType("roadmap")}>Map</button>
        <button className={mapType === "satellite" ? "active" : ""} onClick={() => setMapType("satellite")}>Satellite</button>
      </div>
      <button className="route-recenter" onClick={() => { if (mapRef.current) { const bounds = new google.maps.LatLngBounds(); points.forEach(point => bounds.extend(point.position)); mapRef.current.fitBounds(bounds, 54); } }}><Navigation size={15}/> Re-center</button>
      <div className="route-map-summary"><p className="eyebrow">TRIP OVERVIEW</p><h2>Laguna Adventure</h2><span><CalendarDays size={15}/> 2 Days, 1 Night</span><span><Flag size={15}/> {points.length} Stops</span><span><Car size={15}/> ~84 km total</span><span><Navigation size={15}/> ~2h 22m drive time</span><span><WalletCards size={15}/> Est. Cost: ₱₱ Moderate</span><span><Sparkles size={15}/> Why this itinerary?</span></div>
      <div className="route-legend"><b>Legend</b><span><i className="legend-stop">1</i> Stop</span><span><i className="legend-stay"><Flag size={12}/></i> Overnight Stay</span><span><i className="legend-line"/> Driving Route</span><span><i className="legend-segment"/> Travel Segment</span></div>
      <div className="route-callouts">{points.map(point => <Link key={point.number} href={`/explore/${point.slug}`} className={`route-callout route-callout-${point.number}`}><b>{point.number}</b><span><strong>{point.name}</strong><small>{point.time}</small></span></Link>)}</div>
    </div>
  </section>;
}
