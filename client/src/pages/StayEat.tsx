import { DataUnavailable } from "@/components/shell/DataUnavailable";
import "@/styles/pages/stay-eat.css";
/* El-Biyahe! priority feature tabs — Events, Bus Tours, Passport, Ride Guide, and a
   shared Coming Soon placeholder. Data comes from Supabase via
   @/lib/supabase/queries. Shared shell (Header/BottomNav/Footer/Button/Tag) is
   passed in from App.tsx. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Atom, BadgeCheck, BedDouble, Bookmark, Bus, CalendarDays, Car, Check, ChevronLeft, ChevronRight,
  Clock3, Compass, ExternalLink, Footprints, Gift, GraduationCap, Grid2X2, Heart, Landmark, Leaf, List, Loader2, LocateFixed,
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
import { PageHero, FilterSidebar, RightRailCard, PassportPromoCard, CommunityStrip, StatTile } from "@/components/shell";
import { conceptImages } from "@/lib/conceptImages";
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

const STAY_EAT_TABS = ["All", "Restaurants", "Cafes", "Hotels", "Airbnb & Stays"] as const;


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



export function StayEat({ Header, BottomNav, Footer, Button }: Shell) {
  const { data: delicacies, isLoading: eatsLoading, error: eatsError, refetch: retryEats } = useDelicacies();
  const { data: stays, isLoading: staysLoading, error: staysError, refetch: retryStays } = useAccommodations();
  const isLoading = eatsLoading || staysLoading;
  const error = eatsError || staysError;
  const refetch = () => Promise.all([retryEats(), retryStays()]);
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [minRating, setMinRating] = useState(0);
  const [visible, setVisible] = useState(8);

  const eatItems = useMemo(() => (delicacies ?? []).map(delicacyToVenue), [delicacies]);
  const stayItems = useMemo(() => (stays ?? []).map(accommodationToVenue), [stays]);
  const allItems = useMemo(() => [...eatItems, ...stayItems], [eatItems, stayItems]);

  const locations = useMemo(() => Array.from(new Set(allItems.map(v => v.barangay).filter((b): b is string => !!b))).sort(), [allItems]);

  const withDistance = (v: Venue) =>
    loc.coords && v.lat != null && v.lng != null ? distanceKm(loc.coords, { lat: v.lat, lng: v.lng }) : null;

  const matches = (v: Venue) => {
    if (section === "Restaurants" && (v.kind !== "eat" || /cafe|dessert|drink/i.test(v.categoryLabel))) return false;
    if (section === "Cafes" && (v.kind !== "eat" || !/cafe|dessert|drink/i.test(v.categoryLabel))) return false;
    if (section === "Hotels" && (v.kind !== "stay" || !/hotel|resort/i.test(v.categoryLabel))) return false;
    if (section === "Airbnb & Stays" && (v.kind !== "stay" || /hotel|resort/i.test(v.categoryLabel))) return false;
    if (minRating && (v.rating ?? 0) < minRating) return false;
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

  const filtered = useMemo(() => [...allItems.filter(matches)].sort(sortFn), [allItems, section, eatCategory, stayCategory, query, location, priceTiers, sort, loc.coords, minRating]);
  const isFiltering = section !== "All" || eatCategory !== "All" || stayCategory !== "All" || query.trim() !== "" || location !== "all" || priceTiers.size > 0 || minRating > 0;

  const rated = allItems.filter(v => v.rating != null);
  const avgRating = rated.length ? rated.reduce((s, v) => s + (v.rating as number), 0) / rated.length : null;
  const topRated = useMemo(() => [...allItems].filter(v => v.rating != null).sort((a, b) => (b.rating as number) - (a.rating as number)).slice(0, 5), [allItems]);

  const mapPoints: LBPoint[] = useMemo(() => allItems
    .filter(v => v.lat != null && v.lng != null)
    .map(v => ({ id: v.id, lat: v.lat as number, lng: v.lng as number, name: v.name, kind: v.kind === "eat" ? "Food" : "Hotels", sub: v.categoryLabel })),
    [allItems]);

  const pickEat = (c: typeof eatCategory) => { setSection("Restaurants"); setEatCategory(c); setStayCategory("All"); };
  const pickStay = (c: typeof stayCategory) => { setSection("Airbnb & Stays"); setStayCategory(c); setEatCategory("All"); };
  const pickSection = (t: typeof section) => { setSection(t); setEatCategory("All"); setStayCategory("All"); setVisible(8); };
  const resetFilters = () => { setSection("All"); setEatCategory("All"); setStayCategory("All"); setQuery(""); setLocation("all"); setPriceTiers(new Set()); setMinRating(0); };
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

  const imageFor = (v: Venue) => {
    const n = v.name.toLowerCase();
    if (v.kind === "stay") return /hotel|resort/.test(v.categoryLabel.toLowerCase()) ? conceptImages.stayEatGuestRoom.src : conceptImages.stayEatAirbnbLivingRoom.src;
    if (/cafe|coffee|bean/.test(`${n} ${v.categoryLabel}`.toLowerCase())) return conceptImages.foodCoffeeLatte.src;
    if (/breakfast|silog/.test(n)) return conceptImages.foodBreakfast.src;
    return conceptImages.stayEatGardenRestaurant.src;
  };
  const renderVenue = (v: Venue) => {
    const km = withDistance(v);
    return <article className="stay-v2-card" key={v.id}>
      <div className="stay-v2-card-image"><img src={imageFor(v)} alt="" />{v.featured && <span>FEATURED</span>}</div>
      <div className="stay-v2-card-body"><h3>{v.name}</h3><p>{v.categoryLabel}{v.chips[0] ? ` · ${v.chips[0]}` : ""}</p><div className="stay-v2-card-facts">{v.rating != null && <span>★ {v.rating.toFixed(1)} {v.reviewCount > 0 && `(${v.reviewCount})`}</span>}<span>{v.priceLabel}</span>{km != null && <span><MapPin size={11}/>{formatDistance(km)}</span>}</div>{v.description && <p className="stay-v2-description">{v.description}</p>}{v.kind === "stay" && <button onClick={() => onReserve(v.raw as AccommodationRow)}>Book / Reserve <ExternalLink size={12}/></button>}</div>
    </article>;
  };
  return <><Header/><main className="stay-v2">
    <div className="stay-v2-layout"><div className="stay-v2-primary">
      <PageHero className="stay-v2-hero" title="Stay & Eat" subtitle="Where every stay feels like home, and every meal tells a story." body="Discover restaurants, hotels, and cozy stays in Los Baños made for locals and travelers." image={conceptImages.stayEatHero.src} imageAlt={conceptImages.stayEatHero.alt} rightCard={allItems.length > 0 ? <div className="stay-v2-stats"><StatTile value={eatItems.length} label="Places to Eat" icon={<Utensils size={20}/>} /><StatTile value={stayItems.length} label="Places to Stay" icon={<BedDouble size={20}/>} />{avgRating != null && <StatTile value={avgRating.toFixed(1)} label="Average Rating" icon={<Star size={20}/>} />}</div> : undefined}/>
      <div className="stay-v2-toolbar"><div className="stay-v2-tabs">{STAY_EAT_TABS.map(t => <button key={t} className={section === t ? "active" : ""} onClick={() => pickSection(t)}>{t}</button>)}</div><div className="stay-v2-sort"><label>Sort by: <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="name">Name</option><option value="rating">Top rated</option>{loc.coords && <option value="nearest">Nearest</option>}</select></label><div className="stay-v2-view"><button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view"><Grid2X2 size={16}/> Grid</button><button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="List view"><List size={16}/> List</button></div><button className="stay-v2-mobile-filter" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={15}/> Filters</button></div></div>
      <div className="stay-v2-content"><FilterSidebar title="Filter your search" className={showFilters ? "open" : ""}><button className="stay-v2-reset" onClick={resetFilters}>Reset</button><label className="stay-v2-search"><input aria-label="Search stays or food" placeholder="Search places..." value={query} onChange={e => setQuery(e.target.value)}/><Search size={15}/></label><h3>Category</h3><div className="stay-v2-options">{STAY_EAT_TABS.map(t => <label key={t}><input type="radio" name="stay-section" checked={section === t} onChange={() => pickSection(t)}/>{t}<span>{t === "All" ? allItems.length : allItems.filter(v => t === "Restaurants" ? v.kind === "eat" && !/cafe|dessert|drink/i.test(v.categoryLabel) : t === "Cafes" ? v.kind === "eat" && /cafe|dessert|drink/i.test(v.categoryLabel) : t === "Hotels" ? v.kind === "stay" && /hotel|resort/i.test(v.categoryLabel) : v.kind === "stay" && !/hotel|resort/i.test(v.categoryLabel)).length}</span></label>)}</div><h3>Cuisine</h3><select value={eatCategory} onChange={e => pickEat(e.target.value as typeof eatCategory)}><option value="All">All Cuisines</option>{EAT_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select><h3>Price Range</h3><div className="stay-v2-prices">{PRICE_TIERS.map(t => <button key={t} className={priceTiers.has(t) ? "active" : ""} onClick={() => togglePrice(t)}>{"₱".repeat(t)}</button>)}</div><h3>Rating</h3><div className="stay-v2-prices">{[4,4.5,4.8].map(r => <button key={r} className={minRating === r ? "active" : ""} onClick={() => setMinRating(minRating === r ? 0 : r)}>★ {r}+</button>)}</div><h3>Location</h3><select value={location} onChange={e => setLocation(e.target.value)}><option value="all">All Locations</option>{locations.map(b => <option key={b} value={b}>{b}</option>)}</select><button className="stay-v2-apply" onClick={() => setShowFilters(false)}>Apply Filters</button></FilterSidebar>
      <section className="stay-v2-results">{!isLoading && !error && <h2>{filtered.length} {filtered.length === 1 ? "place" : "places"} found</h2>}{isLoading && <Loading/>}{error && <DataUnavailable onRetry={refetch} />} {!isLoading && !error && (filtered.length ? <><div className={`stay-v2-grid ${viewMode}`}>{filtered.slice(0,visible).map(renderVenue)}</div>{visible < filtered.length && <button className="stay-v2-more" onClick={() => setVisible(v => v + 8)}>Load More Places</button>}</> : <div className="empty-state"><h3>No stays or eats match those filters.</h3><p>Try another category or clear a filter.</p><button onClick={resetFilters}>Clear filters</button></div>)}</section></div>
    </div><aside className="stay-v2-rail"><RightRailCard title="Explore on Map" seeAllHref="/explore"><div className="stay-v2-map"><MapView points={mapPoints} center={LB_CENTER} zoom={13} interactive={false} height={205} ariaLabel="Map of stay and eat spots"/></div><div className="stay-v2-map-key"><span>Nearby</span><span>Restaurants</span><span>Cafes</span><span>Stays</span></div></RightRailCard><PassportPromoCard body="Earn Passport stamps when you dine, stay, and explore partner spots in LB!"/><RightRailCard title="Top Rated">{error ? <DataUnavailable onRetry={refetch}/> : isLoading ? <p className="stay-v2-no-ratings">Loading ratings…</p> : topRated.length ? topRated.slice(0,3).map((v,i) => <div className="stay-v2-top" key={v.id}><img src={imageFor(v)} alt=""/><b>{i+1}</b><span>{v.name}<small>★ {v.rating?.toFixed(1)} ({v.reviewCount})</small></span></div>) : <p className="stay-v2-no-ratings">Ratings will appear here as reviews come in.</p>}</RightRailCard></aside></div>
    <CommunityStrip items={[{icon:<BadgeCheck/>,label:"Local listings",detail:"Discover places around Los Baños"},{icon:<Users/>,label:"Community driven",detail:"Explore local favorites"},{icon:<Compass/>,label:"Tourist friendly",detail:"Find your next stop"},{icon:<ExternalLink/>,label:"Book & contact",detail:"Connect directly with venues"}]}/>
  </main><Footer/><BottomNav/></>;
}
