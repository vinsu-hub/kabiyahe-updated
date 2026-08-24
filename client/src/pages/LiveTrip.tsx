import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Car, Check, Clock3, Compass, Flag, MapPin, Navigation, Plus, Sparkles, Ticket, Users, WalletCards, X } from "lucide-react";
import { Link } from "wouter";
import { MapView } from "@/components/Map";
import { LAGUNA_ROUTE_POINTS, type RoutePoint } from "@/components/RouteOverview";

type LiveStatus = "on-time" | "ahead" | "late" | "unavailable";

const statusCopy: Record<LiveStatus, { label: string; detail: string; tone: string }> = {
  "on-time": { label: "YOU’RE ON TIME", detail: "You’re right on schedule. No unnecessary detours suggested.", tone: "live-status-on-time" },
  ahead: { label: "YOU HAVE TIME", detail: "You have some breathing room before your next scheduled stop.", tone: "live-status-ahead" },
  late: { label: "RUNNING A LITTLE LATE", detail: "You can still make the next stop, but optional stops should wait.", tone: "live-status-late" },
  unavailable: { label: "LOCATION NOT SHARED", detail: "Start Live Trip to compare your position with the route.", tone: "live-status-unavailable" },
};

function LiveMap({ points, showUser }: { points: RoutePoint[]; showUser: boolean }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const center = useMemo(() => points[Math.floor(points.length / 2)]?.position || { lat: 14.2, lng: 121.35 }, [points]);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setMapTypeId(mapType);
  }, [mapType]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (showUser && !userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({ map: mapRef.current, position: { lat: 14.2705, lng: 121.4551 }, title: "Approximate current location", label: { text: "YOU", color: "#ffffff", fontWeight: "800" }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 11, fillColor: "#1687d9", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 4 } });
    } else if (!showUser && userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, [showUser]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setMapTypeId(mapType);
    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point.position));
    map.fitBounds(bounds, 56);
    overlaysRef.current.forEach(overlay => (overlay as any).setMap?.(null));
    overlaysRef.current = [];
    points.forEach(point => {
      const marker = new google.maps.Marker({ map, position: point.position, title: `${point.number}. ${point.name}`, label: { text: String(point.number), color: "#ffffff", fontWeight: "700" } });
      overlaysRef.current.push(marker as unknown as google.maps.MVCObject);
    });
    if (showUser) {
      userMarkerRef.current = new google.maps.Marker({ map, position: { lat: 14.2705, lng: 121.4551 }, title: "Approximate current location", label: { text: "YOU", color: "#ffffff", fontWeight: "800" }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 11, fillColor: "#1687d9", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 4 } });
      overlaysRef.current.push(userMarkerRef.current as unknown as google.maps.MVCObject);
    }
    if (points.length > 1) {
      const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: true, polylineOptions: { strokeColor: "#1fa5a9", strokeOpacity: 0.92, strokeWeight: 5 } });
      new google.maps.DirectionsService().route({ origin: points[0].position, destination: points[points.length - 1].position, waypoints: points.slice(1, -1).map(point => ({ location: point.position, stopover: true })), travelMode: google.maps.TravelMode.DRIVING }, (result, status) => { if (status === "OK" && result) renderer.setDirections(result); });
      overlaysRef.current.push(renderer as unknown as google.maps.MVCObject);
    }
  };

  return <div className="live-map-canvas"><MapView className="live-google-map" initialCenter={center} initialZoom={11} onMapReady={handleMapReady}/><div className="live-map-toggle"><button className={mapType === "roadmap" ? "active" : ""} onClick={() => setMapType("roadmap")}>Map</button><button className={mapType === "satellite" ? "active" : ""} onClick={() => setMapType("satellite")}>Satellite</button></div><button className="live-map-recenter" onClick={() => { if (!mapRef.current) return; const bounds = new google.maps.LatLngBounds(); points.forEach(point => bounds.extend(point.position)); mapRef.current.fitBounds(bounds, 56); }}><Compass size={15}/> Re-center</button><div className="live-map-key"><span><i className="live-key-you"/> You</span><span><i className="live-key-route"/> Route</span></div></div>;
}

export function LiveTripPage({ id = "laguna-weekend", Header, BottomNav }: { id?: string; Header: any; BottomNav: any }) {
  const [status, setStatus] = useState<LiveStatus>("unavailable");
  const [locationState, setLocationState] = useState("Location is not shared");
  const [showIdeas, setShowIdeas] = useState(false);
  const points = LAGUNA_ROUTE_POINTS;
  const nextStop = points[1];
  const currentIndex = 1;
  const startLiveTrip = () => {
    if (!("geolocation" in navigator)) { setStatus("unavailable"); setLocationState("Location is unavailable on this device"); return; }
    navigator.geolocation.getCurrentPosition(() => { setStatus("on-time"); setLocationState("Approximate location updated just now"); }, () => { setStatus("unavailable"); setLocationState("Location permission was not granted"); }, { enableHighAccuracy: false, maximumAge: 120000, timeout: 8000 });
  };
  const copy = statusCopy[status];
  const liveActive = status !== "unavailable";
  return <><Header/><main className="live-trip-page container"><div className="live-trip-topbar"><Link href={`/trips/${id}`} className="back-link"><ArrowLeft size={16}/> Back to My Trips</Link><span className="live-pill"><i/> LIVE TRIP</span></div><div className="live-trip-heading"><div><p className="eyebrow">LIVE TRIP MODE</p><h1>Laguna Adventure</h1><p className="muted">Day 1 · Jun 12, 2025 · 4 travelers</p></div><button className="live-start-button" onClick={startLiveTrip}>{status === "unavailable" ? <Navigation size={16}/> : <Check size={16}/>} {status === "unavailable" ? "Start Live Trip" : "Location active"}</button></div><div className="live-trip-layout"><aside className="live-trip-rail"><section className="live-trip-card live-trip-summary"><div className="live-trip-card-title"><b>Trip Progress</b><Sparkles size={15}/></div><div className="live-progress-line">{points.map((point, index) => <span key={point.number} className={index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming"}>{index < currentIndex ? <Check size={11}/> : point.number}</span>)}</div><div className="live-progress-labels"><span>1 completed</span><b>2 of 5 stops</b><span>42%</span></div><div className="live-progress-bar"><span style={{ width: "42%" }}/></div></section><section className="live-stop-list">{points.map((point, index) => <Link href={`/explore/${point.slug}`} className={`live-stop-item ${index === currentIndex ? "active" : ""}`} key={point.number}><div className={`live-stop-marker ${index < currentIndex ? "done" : ""}`}>{index < currentIndex ? <Check size={12}/> : point.number}</div><div className="live-stop-time">{point.time.split(" ")[0]}<small>{point.time.includes("PM") ? "PM" : "AM"}</small></div><img src={point.image} alt=""/><div className="live-stop-copy"><b>{point.name}</b><small>{point.place}</small><span className={index < currentIndex ? "completed" : index === currentIndex ? "enroute" : "upcoming"}>{index < currentIndex ? "Completed" : index === currentIndex ? "En Route · 18 min" : "Upcoming"}</span></div></Link>)}</section><div className="live-rail-actions"><button onClick={() => setShowIdeas(true)}><Plus size={15}/> Add Stop</button><button onClick={() => setStatus("on-time")}><Compass size={15}/> Optimize Route</button></div></aside><section className="live-trip-main"><div className="live-route-status"><div className="live-status-icon"><Navigation size={20}/></div><div><span>{liveActive ? "You’re En Route to" : "Next stop"}</span><b>{nextStop.name}</b></div><div><span>ETA</span><b>{liveActive ? "11:42 AM" : "—"}</b></div><div><span>Scheduled</span><b>12:00 PM</b></div><div><span>{liveActive ? "Buffer Time" : "Live status"}</span><b>{liveActive ? "18 min" : "Not active"}</b></div><div className="live-status-face">{liveActive ? "☺" : "—"}</div></div><div className="live-map-shell"><LiveMap points={points} showUser={liveActive}/><div className="live-next-stop-card"><img src={nextStop.image} alt=""/><div><span className="eyebrow">NEXT STOP</span><h2>{nextStop.name}</h2><p><MapPin size={13}/> {nextStop.place}</p><div className="live-next-stats"><span><Clock3 size={14}/> 12:00 PM<small>Scheduled</small></span><span><Car size={14}/> {liveActive ? "Calculating" : "—"}<small>ETA</small></span><span><span className="live-face-small">☺</span> {liveActive ? "Pending" : "—"}<small>Buffer</small></span></div></div><div className="live-next-actions"><button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nextStop.name + ", " + nextStop.place)}`, "_blank", "noopener,noreferrer")}><Navigation size={16}/> Navigate</button><Link href={`/explore/${nextStop.slug}`}>View Details</Link></div></div><div className="live-speed-card"><span>{liveActive ? "Current Speed" : "Live telemetry"}</span><b>{liveActive ? <>— <small>km/h</small></> : "Not available"}</b><strong>{liveActive ? "Browser location active" : "Start Live Trip to enable"}</strong><div className="live-speed-bars"/></div></div></section><aside className="live-companion"><section className="live-guide-card"><button className="live-close" aria-label="Close guide" onClick={() => setShowIdeas(false)}><X size={16}/></button><div className="live-guide-title"><span>✦</span><b>Kabiyahe Guide</b><Sparkles size={15}/></div><div className="live-guide-bubble"><b>{liveActive ? "Great pace!" : "Ready when you are"}</b><p>{liveActive ? `${locationState}. Live route calculations will appear when connected.` : "Share your approximate location to compare your ETA with the next stop."}</p></div><p className="live-guide-question">{liveActive ? "Want to add a verified quick stop along the way?" : "Start Live Trip when you want live route guidance."}</p><button className="live-guide-primary" onClick={() => setShowIdeas(true)}>Show Nearby Ideas</button><button className="live-guide-secondary" onClick={() => setShowIdeas(false)}>No, Keep Going</button></section><section className="live-companion-section"><div className="live-section-head"><b>Nearby Quick Stops</b><button onClick={() => setShowIdeas(true)}>See all</button></div>{[{ name: "Café Lumban", copy: "Verified food stop", tag: "Food · Coffee", image: points[1].image },{ name: "Lakeside Viewpoint", copy: "Verified scenic stop", tag: "Scenic · Photo Spot", image: points[2].image }].map(idea => <div className="live-quick-stop" key={idea.name}><img src={idea.image} alt=""/><div><b>{idea.name}</b><small>{idea.copy}</small><span>{idea.tag}</span></div><button onClick={() => setShowIdeas(true)}><Plus size={17}/></button></div>)}</section><section className="live-companion-section"><div className="live-section-head"><b>Trip Status</b><button onClick={() => setStatus(status === "late" ? "on-time" : "late")}>View all</button></div><div className="live-status-list"><span><Check size={14}/> {liveActive ? "Location active" : "Live status"} <small>{liveActive ? "Approximate location" : "Not started"}</small></span><span><Car size={14}/> Traffic <small>Check navigation app</small></span><span><span>☀</span> Weather <small>Not connected</small></span></div></section><section className="live-companion-section live-wallet-section"><div className="live-section-head"><b>Wallet Quick Access</b><span>3 Bookings</span></div><div className="live-wallet-grid"><Link href={`/trips/${id}/wallet`}><WalletCards size={23}/><b>View All<br/>Bookings</b></Link><Link href={`/trips/${id}/wallet`}><Ticket size={23}/><b>Lunch<br/>Reference</b></Link><Link href={`/trips/${id}/wallet`}><Flag size={23}/><b>Stay<br/>Details</b></Link></div></section></aside></div>{showIdeas&&<div className="live-ideas-drawer"><div><b>Verified nearby ideas</b><button onClick={() => setShowIdeas(false)} aria-label="Close nearby ideas"><X size={16}/></button></div><p>Only verified Kabiyahe destinations can be added to your trip.</p><button onClick={() => setShowIdeas(false)}><Check size={15}/> Keep current plan</button></div>}</main><BottomNav/></>;
}
