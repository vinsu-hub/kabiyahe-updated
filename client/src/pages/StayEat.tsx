import "@/styles/pages/stay-eat.css";
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



/* ============================ STAY & EAT ============================ */

const STAY_EAT_TABS = ["All", "Eat", "Stay"] as const;


const EAT_CATEGORIES = DELICACY_CATEGORIES;


const STAY_CATEGORIES = ["Hotel", "Resort", "Homestay"] as const;



type VenueKind = "eat" | "stay";


type Venue = {
  kind: VenueKind;
  id: string;
  name: string;
  categoryLabel: string;
  place: string | null;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  heroImage: string | null;
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  priceTier: number | null;
  priceLabel: string;
  chips: string[];
  raw: DelicacyRow | AccommodationRow;
};



function delicacyToVenue(d: DelicacyRow): Venue {
  return {
    kind: "eat", id: d.id, name: d.name, categoryLabel: d.category,
    place: d.place, barangay: d.barangay, lat: d.lat, lng: d.lng,
    description: d.description, heroImage: d.hero_image,
    rating: d.rating, reviewCount: d.review_count, featured: d.featured,
    priceTier: d.price_tier, priceLabel: "₱".repeat(d.price_tier), chips: d.tags,
    raw: d,
  };
}



/** Heuristic ₱-tier bucket for filtering only — the card always shows the real price_range text. */
function approxPriceTier(range: string | null): number | null {
  if (!range) return null;
  const nums = range.match(/[\d,]+/g)?.map(s => Number(s.replace(/,/g, "")));
  if (!nums?.length) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (avg <= 1000) return 1;
  if (avg <= 2500) return 2;
  if (avg <= 5000) return 3;
  return 4;
}



function accommodationToVenue(a: AccommodationRow): Venue {
  return {
    kind: "stay", id: a.id, name: a.name, categoryLabel: a.category,
    place: a.place, barangay: a.barangay, lat: a.lat, lng: a.lng,
    description: a.description, heroImage: a.hero_image,
    rating: a.rating, reviewCount: a.review_count, featured: a.featured,
    priceTier: approxPriceTier(a.price_range), priceLabel: a.price_range || "Contact for rates",
    chips: a.amenities.slice(0, 2),
    raw: a,
  };
}



function VenueCard({ v, distanceLabel, onReserve }: { v: Venue; distanceLabel?: string; onReserve?: (a: AccommodationRow) => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="elbiyahe-tour-card elbiyahe-delicacy-card">
      <div className="elbiyahe-tour-card-media">
        <img src={v.heroImage || (v.kind === "eat" ? "/scenes/elbiyahe-food.svg" : "/scenes/elbiyahe-hero.svg")} alt={v.name} />
        <span className={`elbiyahe-badge ${v.kind === "eat" ? "green" : "blue"}`}>{v.kind === "eat" ? "EAT" : "STAY"}</span>
        {v.featured && <span className="elbiyahe-badge ochre sm">FEATURED</span>}
        <button
          className={`elbiyahe-card-bookmark ${saved ? "on" : ""}`}
          aria-label={saved ? "Remove favorite" : "Favorite this spot"}
          onClick={() => { setSaved(s => !s); notify(saved ? "Removed from favorites" : "Added to favorites."); }}
        >
          <Heart size={15} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="elbiyahe-tour-card-body">
        <div className="elbiyahe-chip-row"><span className="tag">{v.categoryLabel}</span>{v.chips.slice(0, 2).map(c => <span key={c} className="tag">{c}</span>)}</div>
        <h3>{v.name}</h3>
        <p className="muted" style={{ alignItems: "flex-start" }}><MapPin size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{v.place}{v.barangay ? `, Brgy. ${v.barangay}` : ""}</span></p>
        {v.description && <p className="muted" style={{ fontSize: 12 }}>{v.description}</p>}
        <div className="elbiyahe-tour-card-foot">
          <b>{v.priceLabel}</b>
          <Rating value={v.rating} count={v.reviewCount} />
          {distanceLabel && <span className="muted"><MapPin size={12} /> {distanceLabel}</span>}
        </div>
        {v.kind === "stay" && onReserve && (
          <button className="btn secondary sm" style={{ marginTop: 10, width: "100%" }} onClick={() => onReserve(v.raw as AccommodationRow)}>
            <ExternalLink size={13} /> Book / Reserve
          </button>
        )}
      </div>
    </article>
  );
}



export function StayEat({ Header, BottomNav, Footer, Button }: Shell) {
  const { data: delicacies } = useDelicacies();
  const { data: stays, isLoading, error } = useAccommodations();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const reserve = useReserveAccommodation();
  const loc = useUserLocation();

  const [section, setSection] = useState<(typeof STAY_EAT_TABS)[number]>("All");
  const [eatCategory, setEatCategory] = useState<"All" | (typeof EAT_CATEGORIES)[number]>("All");
  const [stayCategory, setStayCategory] = useState<"All" | (typeof STAY_CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [priceTiers, setPriceTiers] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<"rating" | "name" | "nearest">("name");
  const [showFilters, setShowFilters] = useState(false);

  const eatItems = useMemo(() => (delicacies ?? []).map(delicacyToVenue), [delicacies]);
  const stayItems = useMemo(() => (stays ?? []).map(accommodationToVenue), [stays]);
  const allItems = useMemo(() => [...eatItems, ...stayItems], [eatItems, stayItems]);

  const locations = useMemo(() => Array.from(new Set(allItems.map(v => v.barangay).filter((b): b is string => !!b))).sort(), [allItems]);

  const withDistance = (v: Venue) =>
    loc.coords && v.lat != null && v.lng != null ? distanceKm(loc.coords, { lat: v.lat, lng: v.lng }) : null;

  const matches = (v: Venue) => {
    if (section !== "All" && v.kind !== (section === "Eat" ? "eat" : "stay")) return false;
    if (v.kind === "eat" && eatCategory !== "All" && v.categoryLabel !== eatCategory) return false;
    if (v.kind === "stay" && stayCategory !== "All" && v.categoryLabel !== stayCategory) return false;
    if (location !== "all" && v.barangay !== location) return false;
    if (priceTiers.size > 0 && (v.priceTier == null || !priceTiers.has(v.priceTier))) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${v.name} ${v.place ?? ""} ${v.description ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  };
  const sortFn = (a: Venue, b: Venue) => {
    if (sort === "nearest" && loc.coords) return (withDistance(a) ?? Infinity) - (withDistance(b) ?? Infinity);
    if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  };

  const filtered = useMemo(() => [...allItems.filter(matches)].sort(sortFn), [allItems, section, eatCategory, stayCategory, query, location, priceTiers, sort, loc.coords]);
  const isFiltering = section !== "All" || eatCategory !== "All" || stayCategory !== "All" || query.trim() !== "" || location !== "all" || priceTiers.size > 0;

  const rated = allItems.filter(v => v.rating != null);
  const avgRating = rated.length ? rated.reduce((s, v) => s + (v.rating as number), 0) / rated.length : null;
  const topRated = useMemo(() => [...allItems].filter(v => v.rating != null).sort((a, b) => (b.rating as number) - (a.rating as number)).slice(0, 5), [allItems]);

  const mapPoints: LBPoint[] = useMemo(() => allItems
    .filter(v => v.lat != null && v.lng != null)
    .map(v => ({ id: v.id, lat: v.lat as number, lng: v.lng as number, name: v.name, kind: v.kind === "eat" ? "Food" : "Hotels", sub: v.categoryLabel })),
    [allItems]);

  const pickEat = (c: typeof eatCategory) => { setSection("Eat"); setEatCategory(c); setStayCategory("All"); };
  const pickStay = (c: typeof stayCategory) => { setSection("Stay"); setStayCategory(c); setEatCategory("All"); };
  const pickSection = (t: typeof section) => { setSection(t); if (t !== "Eat") setEatCategory("All"); if (t !== "Stay") setStayCategory("All"); };
  const resetFilters = () => { setSection("All"); setEatCategory("All"); setStayCategory("All"); setQuery(""); setLocation("all"); setPriceTiers(new Set()); };
  const togglePrice = (t: number) => setPriceTiers(s => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const onReserve = (a: AccommodationRow) => {
    if (!user) { navigate("/login?next=/stay-eat"); return; }
    reserve.mutate(
      { id: a.id, booking_referral_url: a.booking_referral_url, name: a.name },
      {
        onSuccess: () => notify(a.booking_referral_url
          ? "Opening the venue's own booking channel — El-Biyahe! never processes payment."
          : "Reservation interest logged. El-Biyahe! never processes payment — contact the venue directly to confirm."),
        onError: err => notify(err.message),
      },
    );
  };

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <section className="elbiyahe-stay-hero">
          <div>
            <p className="eyebrow">DINE. STAY. EXPLORE.</p>
            <h1>Stay &amp; <span className="script">Eat.</span></h1>
            <p className="muted">Where to eat and where to stay around Los Baños — book or reserve directly with the venue.</p>
            <div className="elbiyahe-stay-hero-stats">
              <div className="elbiyahe-hero-stat-chip"><Utensils size={20} /> <div><b>{allItems.length}</b><span>Places to Stay &amp; Eat</span></div></div>
              {avgRating != null && <div className="elbiyahe-hero-stat-chip"><Star size={18} fill="currentColor" /> <div><b>{avgRating.toFixed(1)}</b><span>Avg. rating</span></div></div>}
            </div>
          </div>
          <div className="elbiyahe-stay-hero-media"><img src="/scenes/elbiyahe-hero.svg" alt="" /></div>
        </section>

        <div className="elbiyahe-section-pills">
          {STAY_EAT_TABS.map(t => (
            <button key={t} className={section === t ? "active" : ""} onClick={() => pickSection(t)}>{t}</button>
          ))}
        </div>

        <div className="elbiyahe-events-layout">
          <aside className={`filter-rail elbiyahe-events-filter-rail ${showFilters ? "open" : ""}`}>
            <div className="rail-title"><h3>Find Stay &amp; Eat</h3><button className="link-accent" onClick={resetFilters}>Reset</button></div>
            <div className="searchbox elbiyahe-searchbox">
              <Search size={15} />
              <input aria-label="Search stays or food" placeholder="Search stays or food…" value={query} onChange={ev => setQuery(ev.target.value)} />
            </div>

            <div className="rail-title spaced"><h3>Eat</h3></div>
            <div className="elbiyahe-radio-group">
              <label className="elbiyahe-radio"><input type="radio" name="eat-category" checked={eatCategory === "All"} onChange={() => pickEat("All")} />All Food <span className="elbiyahe-radio-count">{eatItems.length}</span></label>
              {EAT_CATEGORIES.map(c => (
                <label key={c} className="elbiyahe-radio"><input type="radio" name="eat-category" checked={eatCategory === c} onChange={() => pickEat(c)} />{c} <span className="elbiyahe-radio-count">{eatItems.filter(v => v.categoryLabel === c).length}</span></label>
              ))}
            </div>

            <div className="rail-title spaced"><h3>Stay</h3></div>
            <div className="elbiyahe-radio-group">
              <label className="elbiyahe-radio"><input type="radio" name="stay-category" checked={stayCategory === "All"} onChange={() => pickStay("All")} />All Stays <span className="elbiyahe-radio-count">{stayItems.length}</span></label>
              {STAY_CATEGORIES.map(c => (
                <label key={c} className="elbiyahe-radio"><input type="radio" name="stay-category" checked={stayCategory === c} onChange={() => pickStay(c)} />{c} <span className="elbiyahe-radio-count">{stayItems.filter(v => v.categoryLabel === c).length}</span></label>
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
            {error && <LoadError message={(error as Error).message} />}

            {!isLoading && !error && (
              <>
                <div className="elbiyahe-events-main-head">
                  <p className="elbiyahe-results-count">{isFiltering ? `${filtered.length} spot${filtered.length === 1 ? "" : "s"} found` : "Browse by category"}</p>
                  <button className="btn secondary elbiyahe-filters-toggle" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={15} /> Filters</button>
                </div>

                {isFiltering ? (
                  <div className="elbiyahe-tour-grid">
                    {filtered.map(v => {
                      const km = withDistance(v);
                      return <VenueCard v={v} key={v.id} distanceLabel={km != null ? formatDistance(km) : undefined} onReserve={onReserve} />;
                    })}
                  </div>
                ) : (
                  <>
                    {eatItems.length > 0 && (
                      <section className="elbiyahe-event-group">
                        <div className="elbiyahe-row-head"><h2>EAT</h2><button className="link-accent" onClick={() => pickEat("All")}>See all <ArrowRight size={13} /></button></div>
                        <HScrollRow>
                          {eatItems.map(v => {
                            const km = withDistance(v);
                            return <VenueCard v={v} key={v.id} distanceLabel={km != null ? formatDistance(km) : undefined} />;
                          })}
                        </HScrollRow>
                      </section>
                    )}
                    {stayItems.length > 0 && (
                      <section className="elbiyahe-event-group">
                        <div className="elbiyahe-row-head"><h2>STAY</h2><button className="link-accent" onClick={() => pickStay("All")}>See all <ArrowRight size={13} /></button></div>
                        <HScrollRow>
                          {stayItems.map(v => {
                            const km = withDistance(v);
                            return <VenueCard v={v} key={v.id} distanceLabel={km != null ? formatDistance(km) : undefined} onReserve={onReserve} />;
                          })}
                        </HScrollRow>
                      </section>
                    )}
                  </>
                )}

                {isFiltering && filtered.length === 0 && (
                  <div className="empty-state"><Bookmark size={26} /><h3>No stays or eats match those filters.</h3><p>Try another category or clear a filter.</p><Button variant="outline" onClick={resetFilters}>Clear filters</Button></div>
                )}
              </>
            )}
          </section>

          <aside className="elbiyahe-widget-rail">
            <div className="elbiyahe-stay-minimap">
              <MapView points={mapPoints} center={LB_CENTER} zoom={13} interactive={false} height={200} ariaLabel="Map of stay and eat spots" />
            </div>

            <div className="elbiyahe-featured-card">
              <span className="eyebrow">TOP RATED</span>
              {topRated.length > 0 ? topRated.map(v => {
                const km = withDistance(v);
                return (
                  <div className="elbiyahe-discover-row" key={v.id}>
                    <img src={v.heroImage || (v.kind === "eat" ? "/scenes/elbiyahe-food.svg" : "/scenes/elbiyahe-hero.svg")} alt="" />
                    <div>
                      <b>{v.name}</b>
                      <small>{v.kind === "eat" ? "Eat" : "Stay"} · {v.categoryLabel}{km != null ? ` · ${formatDistance(km)}` : ""}</small>
                      <Rating value={v.rating} count={v.reviewCount} />
                    </div>
                  </div>
                );
              }) : <p className="muted" style={{ fontSize: 12 }}>Ratings coming soon.</p>}
            </div>

            <div className="elbiyahe-newsletter-card">
              <QrCode size={22} />
              <h4>Collect. Eat. Earn!</h4>
              <p>Scan spots, collect stamps, and earn rewards with your LB Passport.</p>
              <Link href="/passport" className="btn outline">Open Passport</Link>
            </div>
          </aside>
        </div>

        <div className="elbiyahe-trust-strip">
          <div className="elbiyahe-trust-item">
            <span className="elbiyahe-trust-icon"><BadgeCheck size={18} /></span>
            <div><b>Sourced &amp; Verified Locally</b><p>Every listing is researched by our team, not scraped or guessed.</p></div>
          </div>
          <div className="elbiyahe-trust-item">
            <span className="elbiyahe-trust-icon"><Users size={18} /></span>
            <div><b>Community-Driven Picks</b><p>Got a favorite spot? Suggest it and help other travelers find it.</p></div>
          </div>
          <div className="elbiyahe-trust-item">
            <span className="elbiyahe-trust-icon"><Compass size={18} /></span>
            <div><b>Tourist Friendly</b><p>Curated for first-time visitors exploring Los Baños.</p></div>
          </div>
          <div className="elbiyahe-trust-item">
            <span className="elbiyahe-trust-icon"><ExternalLink size={18} /></span>
            <div><b>Direct Referral Booking</b><p>We connect you straight to the venue — no markup, no middleman payment.</p></div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
