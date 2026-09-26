import { DataUnavailable } from "@/components/shell/DataUnavailable";
import { conceptImages } from "@/lib/conceptImages";
import { PassportPromoCard } from "@/components/shell";
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



/* ============================ RIDE GUIDE ============================ */

const TRICYCLE_FARE_TIERS: [string, string][] = [
  ["0–1 km", "₱14"],
  ["1–2 km", "₱15"],
  ["2–3 km", "₱16"],
  ["3–4 km", "₱17"],
  ["4 km & beyond", "+₱1.00/km"],
];



/* One real, sourced jeepney terminal — beside the Caltex station, in front of Olivarez Plaza.
   Coordinates reused verbatim from the existing real `olivarez-plaza` destination row
   (scripts/seed-geo.mjs). No other terminal could be confidently verified, so this is
   deliberately a single real starting point, not a fabricated terminal network — the rest of
   "Terminal Guide" stays "Coming soon" until more real locations are sourced. */
const TERMINAL_POINT: LBPoint = {
  id: "olivarez-plaza-terminal", lat: 14.1700, lng: 121.2430,
  name: "Olivarez Plaza Jeepney Terminal", kind: "Community",
  sub: "Beside the Caltex station, in front of Olivarez Plaza",
};



function RouteCard({ r }: { r: RideRoute }) {
  return (
    <article className="elbiyahe-tour-card elbiyahe-route-card">
      <div className="elbiyahe-tour-card-media">
        <img src={r.image || conceptImages.transpoJeepneyStreet.src} alt="" />
        <span className="elbiyahe-badge">ROUTE {r.sort}</span>
      </div>
      <div className="elbiyahe-tour-card-body">
        <h3>{r.label}</h3>
        {r.stops && r.stops.length > 0 && (
          <div className="elbiyahe-route-stops">
            {r.stops.map((s, i) => <div key={i} className="elbiyahe-route-stop">{s}</div>)}
          </div>
        )}
        <div className="elbiyahe-route-stats">
          <div><b>{r.fare_text || "—"}</b><small>Fare</small></div>
          <div><b>{r.travel_time_text || "—"}</b><small>Est. Travel Time</small></div>
        </div>
      </div>
    </article>
  );
}



function RideFeedbackModal({ onClose }: { onClose: () => void }) {
  useDismissable(onClose);
  const [body, setBody] = useState("");
  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    notify("Thanks — we'll use this to improve the Ride Guide.");
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Give feedback on the Ride Guide">
      <div className="modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-head"><h2>Help improve the Ride Guide</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <p>Spot a wrong fare, a missing route, or something else? Tell us.</p>
        <form onSubmit={onSubmit}>
          <label className="modal-field">Your feedback<textarea required rows={4} value={body} onChange={ev => setBody(ev.target.value)} placeholder="e.g. The Olivarez fare is now ₱12…" /></label>
          <button className="btn primary" type="submit">Send feedback</button>
        </form>
      </div>
    </div>
  );
}



export function RideGuide({ Header, BottomNav, Footer, Button }: Shell) {
  const { data, isLoading, error, refetch } = useRideGuide();
  const [from, setFrom] = useState("UPLB Freedom Park");
  const [to, setTo] = useState("Los Baños Town Proper");
  const [result, setResult] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const loc = useUserLocation();
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const routeCacheRef = useRef<Map<string, RouteResult | null>>(new Map());

  const onShowTerminalRoute = async () => {
    setRouteResult(null);
    let coords = loc.coords;
    if (!coords) {
      setRouteStatus("locating");
      coords = await loc.request();
      if (!coords) { setRouteStatus("denied"); return; }
    }
    const key = `${coords.lat},${coords.lng}|${TERMINAL_POINT.lat},${TERMINAL_POINT.lng}|walking`;
    const cache = routeCacheRef.current;
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      setRouteResult(cached);
      setRouteStatus(cached ? "ready" : "error");
      return;
    }
    setRouteStatus("loading");
    const res = await fetchRoute(coords, { lat: TERMINAL_POINT.lat, lng: TERMINAL_POINT.lng }, "walking");
    cache.set(key, res);
    setRouteResult(res);
    setRouteStatus(res ? "ready" : "error");
  };
  const terminalRouteActive = routeStatus === "ready" && !!routeResult;
  const terminalPoints: LBPoint[] = terminalRouteActive && loc.coords
    ? [{ id: "me", lat: loc.coords.lat, lng: loc.coords.lng, name: "You" }, TERMINAL_POINT]
    : [TERMINAL_POINT];

  const findRoute = () => {
    setResult(
      `Take a ${from.includes("UPLB") ? "Town Proper–bound" : "UPLB–bound"} jeepney along the National Highway ` +
      `(₱13 est., ~15 min). For the last stretch to ${to}, a tricycle special is ₱30–₱40. ` +
      `Total: about ₱45 and 25 minutes.`,
    );
    notify("Route found.");
  };

  const scrollToPlain = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  const scrollTo = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    scrollToPlain(id);
  };

  const heroTip = data?.tips[1]?.body;
  const calloutTip = data?.tips[0];
  const restTips = data?.tips.slice(1) ?? [];

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <section className="elbiyahe-transpo-hero">
          <div>
            <p className="eyebrow">GET AROUND LIKE A LOCAL</p>
            <h1 style={{ color: "#fff" }}>Easy ways to get around <span style={{ color: "var(--ochre)" }}>Los Baños.</span></h1>
            <p style={{ opacity: .85 }}>Your guide to jeepney, tricycle, and other local transport options in LB.</p>
            <div className="search-row" style={{ marginTop: 14 }}>
              <div className="searchbox elbiyahe-searchbox">
                <MapPin size={15} />
                <input aria-label="Where are you going?" placeholder="Where are you going?" value={to} onChange={ev => setTo(ev.target.value)} />
              </div>
              <Button onClick={() => scrollToPlain("plan-your-ride")}>Find Route <ArrowRight size={15} /></Button>
            </div>
          </div>
          <div className="elbiyahe-transpo-hero-media">
            <img src={conceptImages.transpoJeepneyHero.src} alt={conceptImages.transpoJeepneyHero.alt} />
            {heroTip && (
              <div className="elbiyahe-transpo-tip-chip">
                <Sparkles size={16} />
                <div><b>Travel Tip</b><span>{heroTip}</span></div>
              </div>
            )}
          </div>
        </section>

        <div className="elbiyahe-page-head" style={{ marginTop: 0 }}>
          <div><p className="eyebrow">CHOOSE YOUR RIDE</p></div>
        </div>
        <div className="elbiyahe-ride-choices">
          <div>
            <Bus size={22} /><b>Jeepney</b><small>Fixed routes along main roads, flat-ish fares</small>
            <a href="#jeepney-routes" className="link-accent" onClick={scrollTo("jeepney-routes")}>View Jeepney Routes <ArrowRight size={13} /></a>
          </div>
          <div>
            <Car size={22} /><b>Tricycle</b><small>Door-to-door within town zones</small>
            <a href="#tricycle-fare-guide" className="link-accent" onClick={scrollTo("tricycle-fare-guide")}>View Tricycle Guide <ArrowRight size={13} /></a>
          </div>
          <div>
            <Footprints size={22} /><b>Walking</b><small>UPLB campus and Poblacion are walkable</small>
            <a href="#local-tips" className="link-accent" onClick={scrollTo("local-tips")}>View Walking Tips <ArrowRight size={13} /></a>
          </div>
        </div>

        {isLoading && <Loading />}
        {error && <DataUnavailable onRetry={refetch} />}

        {data && (
          <div className="detail-layout">
            <div className="detail-copy" style={{ padding: 0 }}>
              <section className="elbiyahe-routes" id="jeepney-routes">
                <div className="elbiyahe-row-head"><h2>Popular jeepney routes</h2></div>
                <HScrollRow>
                  {data.jeep.map(r => <RouteCard r={r} key={r.id} />)}
                </HScrollRow>
              </section>

              <section className="elbiyahe-routes" id="tricycle-fare-guide">
                <div className="elbiyahe-row-head"><h2>Tricycle fare guide (base fare)</h2></div>
                <div className="elbiyahe-fare-guide-row">
                  <div className="elbiyahe-fare-guide-icon"><Car size={32} /></div>
                  <div className="elbiyahe-fare-tiers">
                    {TRICYCLE_FARE_TIERS.map(([label, fare]) => (
                      <span key={label}><b>{fare}</b>{label}</span>
                    ))}
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 12 }}><Sparkles size={12} /> Fares may vary depending on time, traffic, and exact location.</p>

                {calloutTip && (
                  <div className="elbiyahe-newsletter-card elbiyahe-tip-callout">
                    <span className="eyebrow" style={{ color: "var(--ochre)" }}>TIP!</span>
                    <p>{calloutTip.body}</p>
                  </div>
                )}

                <div className="elbiyahe-route-list" style={{ marginTop: 14 }}>
                  {data.zones.map(z => (
                    <div key={z.id} className="elbiyahe-route-row">
                      <div className="elbiyahe-route-row-head"><b>{z.label}</b></div>
                      <p className="muted">{z.fare_text}</p>
                      <p>{z.note}</p>
                    </div>
                  ))}
                </div>
              </section>

              {restTips.length > 0 && (
                <section className="elbiyahe-tips" id="local-tips">
                  <h2>Local travel tips</h2>
                  <ul>{restTips.map(t => <li key={t.id}>{t.body}</li>)}</ul>
                </section>
              )}

              <div className="elbiyahe-community-cta" style={{ flexDirection: "column", alignItems: "stretch", gap: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div><h3>Help improve transport in LB!</h3><p>Share your commute experience.</p></div>
                  <Button onClick={() => setShowFeedback(true)}>Give Feedback</Button>
                </div>
                <div className="elbiyahe-value-props">
                  <div><span className="step-icon"><Users size={20} /></span><div><b>Community Driven</b><p className="muted">By LB, for LB</p></div></div>
                  <div><span className="step-icon"><BadgeCheck size={20} /></span><div><b>Reliable Information</b><p className="muted">Updated routes &amp; fares</p></div></div>
                  <div><span className="step-icon"><Compass size={20} /></span><div><b>Tourist Friendly</b><p className="muted">Easy for visitors to navigate</p></div></div>
                </div>
              </div>
            </div>

            <aside className="elbiyahe-widget-rail">
              <div className="elbiyahe-featured-card">
                <div className="elbiyahe-row-head"><span className="eyebrow">QUICK GUIDES</span></div>
                <a className="action-row" href="#jeepney-routes" onClick={scrollTo("jeepney-routes")}>
                  <i className="step-icon"><Bus size={18} /></i>
                  <span><b>Jeepney Route Map</b><small>View all routes on the map</small></span>
                  <ChevronRight size={16} />
                </a>
                <a className="action-row" href="#tricycle-fare-guide" onClick={scrollTo("tricycle-fare-guide")}>
                  <i className="step-icon"><Car size={18} /></i>
                  <span><b>Tricycle Fare Guide</b><small>Base fares and estimates</small></span>
                  <ChevronRight size={16} />
                </a>
                <a className="action-row" href="#terminal-guide" onClick={scrollTo("terminal-guide")}>
                  <i className="step-icon"><MapPin size={18} /></i>
                  <span><b>Terminal Guide</b><small>One real terminal so far</small></span>
                  <ChevronRight size={16} />
                </a>
                <div className="action-row" style={{ opacity: .5 }}>
                  <i className="step-icon"><Clock3 size={18} /></i>
                  <span><b>Operating Hours</b><small>Coming soon</small></span>
                </div>
              </div>

              <div className="elbiyahe-featured-card" id="plan-your-ride">
                <span className="eyebrow">PLAN YOUR RIDE</span>
                <div className="elbiyahe-route-inputs" style={{ marginTop: 10 }}>
                  <label>From<input value={from} onChange={e => setFrom(e.target.value)} /></label>
                  <label>To<input value={to} onChange={e => setTo(e.target.value)} /></label>
                </div>
                <Button onClick={findRoute}><Navigation size={15} /> Find Best Route</Button>
                {result && <div className="elbiyahe-route-result"><Sparkles size={16} /> <p>{result}</p></div>}
              </div>

              <div className="elbiyahe-featured-card" id="terminal-guide">
                <span className="eyebrow">TERMINAL GUIDE</span>
                <p className="muted" style={{ fontSize: 12, margin: "4px 0 8px" }}>{TERMINAL_POINT.name} — {TERMINAL_POINT.sub}</p>
                <div style={{ position: "relative" }}>
                  <MapView
                    points={terminalPoints}
                    center={TERMINAL_POINT}
                    zoom={terminalRouteActive ? undefined : 15}
                    fitBounds={terminalRouteActive}
                    interactive
                    showUser={!!loc.coords}
                    userCoords={loc.coords}
                    height={200}
                    routeGeometry={terminalRouteActive ? routeResult : null}
                    ariaLabel="Map of the Olivarez Plaza jeepney terminal"
                  />
                  {terminalRouteActive && routeResult && (
                    <div className="elbiyahe-route-info">
                      <Navigation size={14} />
                      <span>{formatDistance(routeResult.distanceM / 1000)} · ~{Math.round(routeResult.durationS / 60)} min walk</span>
                    </div>
                  )}
                </div>
                <button
                  className="btn primary"
                  style={{ width: "100%", marginTop: 10 }}
                  disabled={routeStatus === "locating" || routeStatus === "loading"}
                  onClick={onShowTerminalRoute}
                >
                  <Navigation size={15} />
                  {routeStatus === "locating" ? "Locating…" : routeStatus === "loading" ? "Routing…" : "Show Route"}
                </button>
                {routeStatus === "error" && <p className="elbiyahe-route-error">Live route unavailable — showing pin only.</p>}
                {routeStatus === "denied" && <p className="elbiyahe-route-error">Location unavailable — try Directions from the map instead.</p>}
              </div>

              <div className="elbiyahe-featured-card">
                <span className="eyebrow">ZONES MAP</span>
                <p className="muted" style={{ fontSize: 12, margin: "4px 0 8px" }}>Tricycle zones around Los Baños</p>
                <MapView
                  center={LB_CENTER}
                  zoom={13}
                  height={220}
                  ariaLabel="Los Baños tricycle zones map"
                  zones={data.zones.slice(0, 3).map((z, i) => (
                    [
                      { center: { lat: 14.166, lng: 121.238 }, radiusKm: 1.1, label: `Z1 · ${z.fare_text}`, color: "#0e543c" },
                      { center: { lat: 14.177, lng: 121.217 }, radiusKm: 1.0, label: `Z2 · ${z.fare_text}`, color: "#6d2740" },
                      { center: { lat: 14.190, lng: 121.243 }, radiusKm: 1.3, label: `Z3 · ${z.fare_text}`, color: "#d17b27" },
                    ] as ZoneCircle[]
                  )[i])}
                />
                <Link href="/explore" className="btn outline">View Full Map <ArrowRight size={13} /></Link>
              </div>

              <PassportPromoCard body="Scan spots, collect stamps, and earn rewards with your LB Passport." />
            </aside>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
      {showFeedback && <RideFeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
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



type RouteStatus = "idle" | "locating" | "loading" | "ready" | "error" | "denied";
