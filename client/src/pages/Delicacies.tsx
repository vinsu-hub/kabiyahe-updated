import { DataUnavailable } from "@/components/shell/DataUnavailable";
import "@/styles/pages/delicacies.css";
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



/* ============================ DELICACIES ============================ */

const DELICACY_CATEGORIES = [
  "Local Favorites", "Street Food", "Baked Goods", "Cafes & Desserts",
  "Filipino Classics", "Healthy Eats", "Drinks & Beverages", "Market Finds",
] as const;


const PRICE_TIERS = [1, 2, 3, 4] as const;



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



function DelicacyCard({ d, distanceLabel }: { d: DelicacyRow; distanceLabel?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="elbiyahe-tour-card elbiyahe-delicacy-card">
      <div className="elbiyahe-tour-card-media">
        <img src={d.hero_image || conceptImages.foodBukoPie.src} alt={d.name} />
        {d.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}
        <button
          className={`elbiyahe-card-bookmark ${saved ? "on" : ""}`}
          aria-label={saved ? "Remove favorite" : "Favorite this spot"}
          onClick={() => { setSaved(v => !v); notify(saved ? "Removed from favorites" : "Added to favorites."); }}
        >
          <Heart size={15} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="elbiyahe-tour-card-body">
        <h3>{d.name}</h3>
        <p className="muted" style={{ alignItems: "flex-start" }}><MapPin size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{d.place}{d.barangay ? `, Brgy. ${d.barangay}` : ""}</span></p>
        <div className="elbiyahe-chip-row">{d.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
        <div className="elbiyahe-tour-card-foot">
          <Rating value={d.rating} count={d.review_count} />
          {distanceLabel && <span className="muted"><MapPin size={12} /> {distanceLabel}</span>}
        </div>
      </div>
    </article>
  );
}



function SuggestionModal({ onClose }: { onClose: () => void }) {
  useDismissable(onClose);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const submit = useSubmitDelicacySuggestion();
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user) { navigate("/login?next=/delicacies"); return; }
    submit.mutate({ name, place, note }, {
      onSuccess: () => { notify("Thanks! Sent to the El-Biyahe! team for review."); onClose(); },
      onError: err => notify(err.message),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add a recommendation">
      <div className="modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-head"><h2>Got a local favorite?</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <p>Share it with the El-Biyahe! community — our team reviews every submission.</p>
        <form onSubmit={onSubmit}>
          <label className="modal-field">Name<input required value={name} onChange={ev => setName(ev.target.value)} placeholder="e.g. Aling Nena's Suman" /></label>
          <label className="modal-field">Where to find it<input value={place} onChange={ev => setPlace(ev.target.value)} placeholder="Vendor / place" /></label>
          <label className="modal-field">Why it's worth trying<textarea rows={3} value={note} onChange={ev => setNote(ev.target.value)} /></label>
          <button className="btn primary" type="submit" disabled={submit.isPending}>{user ? "Send recommendation" : "Sign in to send"}</button>
        </form>
      </div>
    </div>
  );
}



export function Delicacies({ Header, BottomNav, Footer, Button }: Shell) {
  const { data, isLoading, error, refetch } = useDelicacies();
  const loc = useUserLocation();
  const [category, setCategory] = useState<"All" | (typeof DELICACY_CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [priceTiers, setPriceTiers] = useState<Set<number>>(new Set());
  const [dietary, setDietary] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"rating" | "name" | "nearest">("name");
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  const items = data ?? [];
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of items) m.set(d.category, (m.get(d.category) ?? 0) + 1);
    return m;
  }, [items]);
  const locations = useMemo(() => Array.from(new Set(items.map(d => d.barangay).filter((b): b is string => !!b))).sort(), [items]);
  const dietaryOptions = useMemo(() => Array.from(new Set(items.flatMap(d => d.dietary_tags))).sort(), [items]);

  const withDistance = (d: DelicacyRow) =>
    loc.coords && d.lat != null && d.lng != null ? distanceKm(loc.coords, { lat: d.lat, lng: d.lng }) : null;

  const matches = (d: DelicacyRow) => {
    const q = query.trim().toLowerCase();
    if (category !== "All" && d.category !== category) return false;
    if (location !== "all" && d.barangay !== location) return false;
    if (priceTiers.size > 0 && !priceTiers.has(d.price_tier)) return false;
    if (dietary.size > 0 && !Array.from(dietary).every(t => d.dietary_tags.includes(t))) return false;
    if (q && !`${d.name} ${d.place ?? ""} ${d.description ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  };
  const sortFn = (a: DelicacyRow, b: DelicacyRow) => {
    if (sort === "nearest" && loc.coords) return (withDistance(a) ?? Infinity) - (withDistance(b) ?? Infinity);
    if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  };

  const filtered = useMemo(() => [...items.filter(matches)].sort(sortFn), [items, category, query, location, priceTiers, dietary, sort, loc.coords]);
  const isFiltering = category !== "All" || query.trim() !== "" || location !== "all" || priceTiers.size > 0 || dietary.size > 0;

  const discover = useMemo(() => [...items].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name)).slice(0, 5), [items]);

  const resetFilters = () => { setCategory("All"); setQuery(""); setLocation("all"); setPriceTiers(new Set()); setDietary(new Set()); };
  const togglePrice = (t: number) => setPriceTiers(s => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const toggleDietary = (t: string) => setDietary(s => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <section className="elbiyahe-delicacies-hero">
          <div>
            <p className="eyebrow">TASTE WHAT'S LOCAL</p>
            <h1>Taste what's <span className="script" style={{ display: "inline" }}>local.</span></h1>
            <p className="muted">Discover the flavors that make Los Baños special.</p>
            <div className="elbiyahe-hero-stat-chip"><Utensils size={20} /> <div><b>{items.length}</b><span>Delicacies to try</span></div></div>
          </div>
          <div className="elbiyahe-delicacies-hero-media"><img src={conceptImages.foodSilogHero.src} alt={conceptImages.foodSilogHero.alt} /></div>
        </section>

        <div className="elbiyahe-events-layout">
          <aside className={`filter-rail elbiyahe-events-filter-rail ${showFilters ? "open" : ""}`}>
            <div className="rail-title"><h3>Find Delicacies</h3><button className="link-accent" onClick={resetFilters}>Reset</button></div>
            <div className="searchbox elbiyahe-searchbox">
              <Search size={15} />
              <input aria-label="Search food or restaurants" placeholder="Search food or restaurants…" value={query} onChange={ev => setQuery(ev.target.value)} />
            </div>

            <div className="rail-title spaced"><h3>Category</h3></div>
            <div className="elbiyahe-radio-group">
              <label className="elbiyahe-radio"><input type="radio" name="d-category" checked={category === "All"} onChange={() => setCategory("All")} />All Delicacies <span className="elbiyahe-radio-count">{items.length}</span></label>
              {DELICACY_CATEGORIES.map(c => (
                <label key={c} className="elbiyahe-radio"><input type="radio" name="d-category" checked={category === c} onChange={() => setCategory(c)} />{c} <span className="elbiyahe-radio-count">{counts.get(c) ?? 0}</span></label>
              ))}
            </div>

            <div className="rail-title spaced"><h3>Filter By</h3></div>
            <label className="elbiyahe-rail-select-wrap">
              <MapPin size={14} />
              <select className="elbiyahe-rail-select" value={location} onChange={ev => setLocation(ev.target.value)}>
                <option value="all">All Locations</option>
                {locations.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
            <div className="elbiyahe-price-group">
              {PRICE_TIERS.map(t => (
                <button key={t} className={priceTiers.has(t) ? "active" : ""} onClick={() => togglePrice(t)}>{"₱".repeat(t)}</button>
              ))}
            </div>
            {dietaryOptions.length > 0 && (
              <>
                <div className="rail-title spaced"><h3>Dietary Preference</h3></div>
                <div className="elbiyahe-radio-group">
                  {dietaryOptions.map(t => (
                    <label key={t} className="elbiyahe-radio"><input type="checkbox" checked={dietary.has(t)} onChange={() => toggleDietary(t)} />{t}</label>
                  ))}
                </div>
              </>
            )}
            <div className="rail-title spaced"><h3>Sort By</h3></div>
            <select className="elbiyahe-rail-select" value={sort} onChange={ev => setSort(ev.target.value as typeof sort)}>
              <option value="name">Name (A–Z)</option>
              <option value="rating">Top Rated</option>
              {loc.coords && <option value="nearest">Nearest</option>}
            </select>
            {!loc.coords && (
              <button className="link-accent" style={{ margin: "0 8px 10px" }} onClick={() => loc.request()}>
                <Navigation size={13} /> {loc.status === "prompting" ? "Locating…" : "Use my location"}
              </button>
            )}
            <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
          </aside>

          <section className="elbiyahe-events-main">
            {isLoading && <Loading />}
            {error && <DataUnavailable onRetry={refetch} />}

            {!isLoading && !error && (
              <>
                <div className="elbiyahe-events-main-head">
                  <p className="elbiyahe-results-count">{isFiltering ? `${filtered.length} spot${filtered.length === 1 ? "" : "s"} found` : "Browse by category"}</p>
                  <button className="btn secondary elbiyahe-filters-toggle" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={15} /> Filters</button>
                </div>

                {isFiltering ? (
                  <div className="elbiyahe-tour-grid">
                    {filtered.map(d => {
                      const km = withDistance(d);
                      return <DelicacyCard d={d} key={d.id} distanceLabel={km != null ? formatDistance(km) : undefined} />;
                    })}
                  </div>
                ) : (
                  DELICACY_CATEGORIES.map(c => {
                    const rowItems = items.filter(d => d.category === c);
                    if (!rowItems.length) return null;
                    return (
                      <section key={c} className="elbiyahe-event-group">
                        <div className="elbiyahe-row-head"><h2>{c.toUpperCase()}</h2><button className="link-accent" onClick={() => setCategory(c)}>See all <ArrowRight size={13} /></button></div>
                        <HScrollRow>
                          {rowItems.map(d => {
                            const km = withDistance(d);
                            return <DelicacyCard d={d} key={d.id} distanceLabel={km != null ? formatDistance(km) : undefined} />;
                          })}
                        </HScrollRow>
                      </section>
                    );
                  })
                )}

                {isFiltering && filtered.length === 0 && (
                  <div className="empty-state"><Utensils size={26} /><h3>No delicacies match those filters.</h3><p>Try another category or clear a filter.</p><Button variant="outline" onClick={resetFilters}>Clear filters</Button></div>
                )}

                <div className="elbiyahe-community-cta">
                  <div><h3>Got a local favorite?</h3><p>Share it with the El-Biyahe! community!</p></div>
                  <Button onClick={() => setShowSuggest(true)}>Add a Recommendation</Button>
                </div>
              </>
            )}
          </section>

          <aside className="elbiyahe-widget-rail">
            <div className="elbiyahe-featured-card">
              <span className="eyebrow">MORE TO DISCOVER</span>
              {discover.map(d => {
                const km = withDistance(d);
                return (
                  <div className="elbiyahe-discover-row" key={d.id}>
                    <img src={d.hero_image || conceptImages.foodBukoPie.src} alt="" />
                    <div>
                      <b>{d.name}</b>
                      <small>{d.category}{km != null ? ` · ${formatDistance(km)}` : ""}</small>
                      <Rating value={d.rating} count={d.review_count} />
                    </div>
                  </div>
                );
              })}
            </div>
            <PassportPromoCard body="Scan spots, collect stamps, and earn rewards with your LB Passport." />
          </aside>
        </div>
      </main>
      <Footer />
      <BottomNav />
      {showSuggest && <SuggestionModal onClose={() => setShowSuggest(false)} />}
    </>
  );
}
