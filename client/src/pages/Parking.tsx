import { DataUnavailable } from "@/components/shell/DataUnavailable";
import { conceptImages } from "@/lib/conceptImages";
/* El-Biyahe! priority feature tabs — Events, Bus Tours, Passport, Ride Guide, and a
   shared Coming Soon placeholder. Data comes from Supabase via
   @/lib/supabase/queries. Shared shell (Header/BottomNav/Footer/Button/Tag) is
   passed in from App.tsx. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Atom, BadgeCheck, BedDouble, Bookmark, Bus, CalendarDays, Car, Check, ChevronLeft, ChevronRight,
  Clock3, Compass, ExternalLink, Footprints, Gift, GraduationCap, Heart, Landmark, Leaf, List, Loader2, LocateFixed,
  MapPin, Navigation, QrCode, Search, Share2, ShoppingBag, SlidersHorizontal, Sparkles, Star, Store, Sun, Ticket,
  Trophy, User, Users, UsersRound, Utensils, X,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import {
  useAccommodations, useClaimMission, useCurrentSeason, useDelicacies, useEvent, useEvents, useLeaderboard,
  useMyRsvp, useParkingSpots, usePassport, usePassportMissions, useReserveAccommodation, useReserveTour,
  useRideGuide, useScanPassport, useSeasons, useSubmitDelicacySuggestion, useToggleRsvp, useTour, useTours,
  useHeritageWalk,
} from "@/lib/supabase/queries";
import type { TourListItem } from "@/lib/supabase/queries";
import type {
  AccommodationRow, DelicacyRow, EventRow, HeritageWalkStop, LeaderboardRow, ParkingSpotRow, PassportLocationPublic,
  PassportMission, PassportReward, RideRoute, StampCategory,
} from "@/lib/supabase/types";
import { MapView, type LBPoint, type ZoneCircle } from "@/components/MapView";
import { Rating } from "@/components/Rating";
import {
  LB_CENTER, directionsUrl, distanceKm, fetchRoute, formatDistance, getPosition, prefersReducedMotion,
  type RouteResult, useUserLocation,
} from "@/lib/geo";
import QRCode from "qrcode";


interface Shell {
  Header: React.ComponentType;
  BottomNav: React.ComponentType;
  Footer: React.ComponentType;
  Button: React.ComponentType<any>;
  Tag: React.ComponentType<any>;
}



const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent("elbiyahe:notice", { detail: message }));



export function Loading() {
  return (
    <div className="elbiyahe-loading" role="status">
      <Loader2 size={22} className="elbiyahe-spin" /> Loading…
    </div>
  );
}


/** Close-on-Escape for the hand-rolled modal-backdrop overlays (parity with App's <Modal>).
    Pass undefined when the overlay is closed so it can be called unconditionally. */
function useDismissable(onClose?: () => void) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
}


export function LoadError({ message }: { message?: string }) {
  return (
    <div className="empty-state">
      <QrCode size={24} />
      <h3>Couldn't load this yet.</h3>
      <p>{message || "Check your connection and try again."}</p>
    </div>
  );
}



/* Horizontal scroll-snap row with prev/next arrows — reuses the same scroll-by-ref
   approach the app needs nowhere else yet, so it lives here. */
function HScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useState<{ current: HTMLDivElement | null }>(() => ({ current: null }))[0];
  const scrollBy = (dx: number) => ref.current?.scrollBy({ left: dx, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  return (
    <div className="elbiyahe-hrow-wrap">
      <button className="elbiyahe-hrow-arrow left" aria-label="Scroll left" onClick={() => scrollBy(-320)}><ChevronLeft size={16} /></button>
      <div className="elbiyahe-delicacy-row" ref={el => { ref.current = el; }}>{children}</div>
      <button className="elbiyahe-hrow-arrow right" aria-label="Scroll right" onClick={() => scrollBy(320)}><ChevronRight size={16} /></button>
    </div>
  );
}



/* ============================ PARKING ============================ */

const PARKING_FILTERS = ["All", "free", "paid"] as const;


const PARKING_SORTS = ["Recommended", "Nearest", "Cheapest"] as const;


const CATEGORY_ICON: Record<string, React.ComponentType<any>> = {
  mall: ShoppingBag, supermarket: ShoppingBag, institutional: GraduationCap,
  resort: BedDouble, hotel: BedDouble, market: Store,
};



const PARK_NEAR_DESTINATIONS = [
  { label: "Robinsons Town Mall", icon: ShoppingBag, query: "Robinsons" },
  { label: "UPLB", icon: GraduationCap, query: "UPLB" },
  { label: "Los Baños Public Market", icon: Store, query: "Public Market" },
  { label: "Municipal Hall", icon: Landmark, query: "Municipal Hall" },
  { label: "Hotels & Resorts", icon: BedDouble, category: "hotel-resort" },
] as const;



type RouteStatus = "idle" | "locating" | "loading" | "ready" | "error" | "denied";



function ParkingCard({ p, distanceKm: km, routeStatus, isRouteActive, onShowRoute }: {
  p: ParkingSpotRow; distanceKm?: number;
  routeStatus: RouteStatus; isRouteActive: boolean; onShowRoute: (p: ParkingSpotRow) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  useDismissable(showDetails ? () => setShowDetails(false) : undefined);
  const Icon = (p.category && CATEGORY_ICON[p.category]) || Car;
  const walkMin = km != null ? Math.max(1, Math.round(km * 12)) : null;
  const activeStatus = isRouteActive ? routeStatus : "idle";
  return (
    <article className="elbiyahe-tour-card elbiyahe-parking-card">
      <div className="elbiyahe-tour-card-media elbiyahe-parking-card-icon">
        <Icon size={30} />
        <span className={`tag ${p.kind === "free" ? "" : "ochre"}`}>{p.kind === "free" ? "Free" : "Paid"}</span>
      </div>
      <div className="elbiyahe-tour-card-body">
        <h3>{p.name}</h3>
        <p className="muted" style={{ alignItems: "flex-start" }}><MapPin size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{p.place}{p.barangay ? `, ${p.barangay}` : ""}</span></p>
        <p className="muted" style={{ fontSize: 12 }}>{[p.access_type, p.hours_label].filter(Boolean).join(" · ") || "Access & hours not listed"}</p>
        {p.fee_label && <p style={{ fontWeight: 700, color: "var(--forest)" }}>{p.fee_label}</p>}
        {km != null && <p className="muted" style={{ fontSize: 12 }}>{formatDistance(km)} · ~{walkMin} min walk</p>}
        <p className="muted" style={{ fontSize: 11 }}>{p.verified === "verified" ? "✓ Verified" : "Community-reported"}</p>
        <div className="elbiyahe-tour-card-foot">
          <button className="btn secondary" style={{ minHeight: 32, fontSize: 12 }} onClick={() => setShowDetails(true)}>Details</button>
          {p.lat != null && p.lng != null && (
            <a href={directionsUrl(p.lat, p.lng)} target="_blank" rel="noreferrer" className="btn secondary" style={{ minHeight: 32, fontSize: 12 }}><Navigation size={13} /> Directions</a>
          )}
        </div>
        {p.lat != null && p.lng != null && (
          <button
            className="btn primary"
            style={{ minHeight: 32, fontSize: 12, width: "100%", marginTop: 8 }}
            disabled={activeStatus === "locating" || activeStatus === "loading"}
            onClick={() => onShowRoute(p)}
          >
            <Navigation size={13} />
            {activeStatus === "locating" ? "Locating…" : activeStatus === "loading" ? "Routing…" : "Show Route"}
          </button>
        )}
        {activeStatus === "error" && <p className="elbiyahe-route-error">Live route unavailable — showing pins only.</p>}
        {activeStatus === "denied" && <p className="elbiyahe-route-error">Location unavailable — use Directions instead.</p>}
      </div>
      {showDetails && (
        <div className="modal-backdrop" onClick={() => setShowDetails(false)} role="dialog" aria-modal="true" aria-label={p.name}>
          <div className="modal" onClick={ev => ev.stopPropagation()}>
            <div className="modal-head"><h2>{p.name}</h2><button onClick={() => setShowDetails(false)} aria-label="Close"><X size={18} /></button></div>
            <p className="muted"><MapPin size={13} /> {p.place}{p.barangay ? `, ${p.barangay}` : ""}</p>
            <p><b>{p.kind === "free" ? "Free" : "Paid"}</b>{p.fee_label ? ` · ${p.fee_label}` : ""}</p>
            {p.access_type && <p>Access: {p.access_type}</p>}
            {p.hours_label && <p>Hours: {p.hours_label}</p>}
            {p.notes && <p className="muted">{p.notes}</p>}
            <p className="muted" style={{ fontSize: 11 }}>{p.verified === "verified" ? "✓ Verified by El-Biyahe!" : "Community-reported — confirm details on site."}</p>
          </div>
        </div>
      )}
    </article>
  );
}



function ParkingFeedbackModal({ onClose }: { onClose: () => void }) {
  useDismissable(onClose);
  const [body, setBody] = useState("");
  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    notify("Thanks — we'll look into it.");
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Report a parking issue">
      <div className="modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-head"><h2>Report an issue</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <p>Wrong location, outdated access info, or something else? Tell us.</p>
        <form onSubmit={onSubmit}>
          <label className="modal-field">What's wrong?<textarea required rows={4} value={body} onChange={ev => setBody(ev.target.value)} placeholder="e.g. This lot is now for staff only…" /></label>
          <button className="btn primary" type="submit">Send report</button>
        </form>
      </div>
    </div>
  );
}



export function Parking({ Header, BottomNav, Footer, Button }: Shell) {
  const { data, isLoading, error, refetch } = useParkingSpots();
  const [filter, setFilter] = useState<(typeof PARKING_FILTERS)[number]>("All");
  const [sort, setSort] = useState<(typeof PARKING_SORTS)[number]>("Recommended");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const loc = useUserLocation();

  const [activeRouteSpotId, setActiveRouteSpotId] = useState<string | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const routeCacheRef = useRef<Map<string, RouteResult | null>>(new Map());

  const onShowRoute = async (p: ParkingSpotRow) => {
    if (p.lat == null || p.lng == null) return;
    setActiveRouteSpotId(p.id);
    setRouteResult(null);
    let coords = loc.coords;
    if (!coords) {
      setRouteStatus("locating");
      coords = await loc.request();
      if (!coords) { setRouteStatus("denied"); return; }
    }
    const key = `${coords.lat},${coords.lng}|${p.lat},${p.lng}|walking`;
    const cache = routeCacheRef.current;
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      setRouteResult(cached);
      setRouteStatus(cached ? "ready" : "error");
      return;
    }
    setRouteStatus("loading");
    const result = await fetchRoute(coords, { lat: p.lat, lng: p.lng }, "walking");
    cache.set(key, result);
    setRouteResult(result);
    setRouteStatus(result ? "ready" : "error");
  };

  const items = data ?? [];
  const withDistance = (p: ParkingSpotRow) =>
    loc.coords && p.lat != null && p.lng != null ? distanceKm(loc.coords, { lat: p.lat, lng: p.lng }) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter(p => {
      if (filter !== "All" && p.kind !== filter) return false;
      if (areaFilter && p.barangay !== areaFilter) return false;
      if (categoryFilter === "hotel-resort" && p.category !== "hotel" && p.category !== "resort") return false;
      if (q && !`${p.name} ${p.place ?? ""} ${p.barangay ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === "Nearest" && loc.coords) {
      list = [...list].sort((a, b) => (withDistance(a) ?? Infinity) - (withDistance(b) ?? Infinity));
    } else if (sort === "Cheapest") {
      list = [...list].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "free" ? -1 : 1));
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [items, filter, query, areaFilter, categoryFilter, sort, loc.coords]);

  const areas = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of items) if (p.barangay) m.set(p.barangay, (m.get(p.barangay) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const nearbyWithinKm = loc.coords ? items.filter(p => (withDistance(p) ?? Infinity) <= 1).length : null;

  const mapPoints: LBPoint[] = items.filter(p => p.lat != null && p.lng != null).map(p => ({
    id: p.id, lat: p.lat!, lng: p.lng!, name: p.name, kind: "Parking",
    sub: [p.kind === "free" ? "Free" : "Paid", p.fee_label].filter(Boolean).join(" · "),
    label: p.kind === "free" ? "FREE" : (p.fee_label ?? "PAID"),
    labelColor: p.kind === "free" ? "#0e543c" : "#c97927",
  }));

  const activeSpot = activeRouteSpotId ? items.find(p => p.id === activeRouteSpotId) : null;
  const routeActive = routeStatus === "ready" && !!routeResult && !!activeSpot;
  const displayPoints: LBPoint[] =
    routeActive && loc.coords && activeSpot?.lat != null && activeSpot?.lng != null
      ? [
          { id: "me", lat: loc.coords.lat, lng: loc.coords.lng, name: "You" },
          { id: activeSpot.id, lat: activeSpot.lat, lng: activeSpot.lng, name: activeSpot.name, kind: "Parking",
            label: activeSpot.kind === "free" ? "FREE" : (activeSpot.fee_label ?? "PAID"),
            labelColor: activeSpot.kind === "free" ? "#0e543c" : "#c97927" },
        ]
      : mapPoints;

  const jumpToResults = () => document.getElementById("parking-results")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <section className="elbiyahe-transpo-hero">
          <div>
            <p className="eyebrow">GET AROUND LIKE A LOCAL</p>
            <h1 style={{ color: "#fff" }}>Parking without <span style={{ color: "var(--ochre)" }}>the guesswork.</span></h1>
            <p style={{ opacity: .85 }}>Find nearby parking, check access, and get directions to where you're headed.</p>
            <div className="search-row" style={{ marginTop: 14 }}>
              <div className="searchbox elbiyahe-searchbox">
                <Search size={15} />
                <input aria-label="Where are you going?" placeholder="Where are you going?" value={query} onChange={ev => setQuery(ev.target.value)} />
              </div>
              <Button onClick={jumpToResults}>Search <ArrowRight size={15} /></Button>
            </div>
          </div>
          <div className="elbiyahe-transpo-hero-media">
            <img src={conceptImages.transpoJeepneyStreet.src} alt={conceptImages.transpoJeepneyStreet.alt} />
          </div>
        </section>

        <div className="filter-pills">
          <button className={loc.coords ? "active" : ""} onClick={() => loc.request()}><LocateFixed size={13} /> {loc.status === "prompting" ? "Locating…" : "Near Me"}</button>
          {PARKING_FILTERS.map(f => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f === "All" ? "All" : f === "free" ? "Free" : "Paid"}</button>
          ))}
        </div>
        <div className="elbiyahe-tabs" style={{ marginTop: 4 }}>
          {PARKING_SORTS.map(s => (
            <button key={s} className={sort === s ? "active" : ""} onClick={() => setSort(s)} disabled={s === "Nearest" && !loc.coords}>{s}</button>
          ))}
        </div>

        {isLoading && <Loading />}
        {error && <DataUnavailable onRetry={refetch} />}

        {mapPoints.length > 0 && (
          <div style={{ position: "relative", marginTop: 12 }}>
            <MapView
              points={displayPoints}
              fitBounds
              interactive
              showUser={!!loc.coords}
              userCoords={loc.coords}
              height={300}
              routeGeometry={routeActive ? routeResult : null}
              ariaLabel="Map of Los Baños parking areas"
            />
            {routeActive && routeResult && (
              <div className="elbiyahe-route-info">
                <Navigation size={14} />
                <span>{formatDistance(routeResult.distanceM / 1000)} · ~{Math.round(routeResult.durationS / 60)} min walk to {activeSpot?.name}</span>
              </div>
            )}
            {!routeActive && nearbyWithinKm != null && (
              <div className="elbiyahe-transpo-tip-chip" style={{ position: "absolute", right: 14, top: 14, left: "auto", bottom: "auto", maxWidth: 220 }}>
                <Car size={16} />
                <div><b>{nearbyWithinKm} parking spot{nearbyWithinKm === 1 ? "" : "s"}</b><span>within 1 km</span></div>
              </div>
            )}
          </div>
        )}

        <section className="elbiyahe-routes" id="parking-results" style={{ marginTop: 18 }}>
          <div className="elbiyahe-row-head"><h2>Nearby Parking ({filtered.length})</h2></div>
          {filtered.length > 0 ? (
            <HScrollRow>
              {filtered.map(p => (
                <ParkingCard
                  p={p}
                  distanceKm={withDistance(p) ?? undefined}
                  key={p.id}
                  routeStatus={routeStatus}
                  isRouteActive={activeRouteSpotId === p.id}
                  onShowRoute={onShowRoute}
                />
              ))}
            </HScrollRow>
          ) : (
            !isLoading && !error && <div className="empty-state"><Car size={26} /><h3>No parking spots match those filters.</h3></div>
          )}
        </section>

        <div className="detail-layout" style={{ marginTop: 8 }}>
          <div className="detail-copy" style={{ padding: 0 }}>
            <section className="elbiyahe-routes">
              <div className="elbiyahe-row-head"><h2>Park near your destination</h2></div>
              <div className="elbiyahe-quick-grid">
                {PARK_NEAR_DESTINATIONS.map(d => (
                  <button key={d.label} className="elbiyahe-quick-item" onClick={() => { setQuery("query" in d ? d.query ?? "" : ""); setCategoryFilter("category" in d ? d.category ?? null : null); jumpToResults(); }}>
                    <span className="elbiyahe-quick-icon"><d.icon size={22} /></span>
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <aside className="elbiyahe-widget-rail">
            <div className="elbiyahe-featured-card">
              <span className="eyebrow">EXPLORE PARKING BY AREA</span>
              <div className="elbiyahe-radio-group" style={{ marginTop: 8 }}>
                <label className="elbiyahe-radio"><input type="radio" name="area" checked={areaFilter === null} onChange={() => { setAreaFilter(null); jumpToResults(); }} />All areas <span className="elbiyahe-radio-count">{items.length}</span></label>
                {areas.map(([area, count]) => (
                  <label key={area} className="elbiyahe-radio"><input type="radio" name="area" checked={areaFilter === area} onChange={() => { setAreaFilter(area); jumpToResults(); }} />{area} <span className="elbiyahe-radio-count">{count}</span></label>
                ))}
              </div>
            </div>

            <div className="elbiyahe-featured-card">
              <span className="eyebrow">PARKING GUIDE</span>
              <div className="action-row">
                <i className="step-icon"><Sparkles size={18} /></i>
                <span><b>Tips for a hassle-free trip</b><small>Confirm rates & access on site — UPLB lots may restrict non-affiliates</small></span>
              </div>
              <div className="action-row" style={{ opacity: .5 }}>
                <i className="step-icon"><MapPin size={18} /></i>
                <span><b>Parking rules in Los Baños</b><small>Coming soon</small></span>
              </div>
              <a className="action-row" href="#" onClick={ev => { ev.preventDefault(); setShowFeedback(true); }}>
                <i className="step-icon"><SlidersHorizontal size={18} /></i>
                <span><b>Report an issue</b><small>Help us keep information accurate</small></span>
                <ChevronRight size={16} />
              </a>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <BottomNav />
      {showFeedback && <ParkingFeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
  );
}
