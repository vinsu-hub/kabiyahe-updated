/* El-Biyahe! priority feature tabs — Events, Bus Tours, Passport, Ride Guide, and a
   shared Coming Soon placeholder. Data comes from Supabase via
   @/lib/supabase/queries. Shared shell (Header/BottomNav/Footer/Button/Tag) is
   passed in from App.tsx. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Atom, BadgeCheck, BedDouble, Bookmark, Bus, CalendarDays, Car, Check, ChevronLeft, ChevronRight,
  Clock3, Compass, ExternalLink, Footprints, Gift, GraduationCap, Heart, Landmark, Leaf, List, Loader2, LocateFixed,
  MapPin, Navigation, QrCode, Route, Search, Share2, ShoppingBag, SlidersHorizontal, Sparkles, Star, Store, Sun, Ticket,
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
const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

function useSeasonName() {
  const { data } = useSeasons();
  return (key: string | null | undefined) =>
    (key && data?.find(s => s.key === key)?.name.replace(/^El-Biyahe!\s*/, "")) || "";
}

/** Category/slug-aware fallback art so every event doesn't render the same generic scene. */
function fallbackScene(e: Pick<EventRow, "slug" | "category">): string {
  const bySlug: Record<string, string> = {
    "los-banos-heritage-walk": "elbiyahe-heritage",
    "sunset-at-the-park": "elbiyahe-sunset",
    "flower-and-garden-show": "elbiyahe-lake",
    "mt-makiling-trail-activities": "elbiyahe-falls",
    "uplb-loyalty-day": "elbiyahe-campus",
    "uplb-feb-fair": "elbiyahe-campus",
    "syensaya": "elbiyahe-campus",
  };
  const byCategory: Record<string, string> = {
    Culture: "elbiyahe-heritage",
    Food: "elbiyahe-food",
    Sports: "elbiyahe-falls",
    Arts: "elbiyahe-market",
    Community: "elbiyahe-market",
  };
  const name = bySlug[e.slug] ?? byCategory[e.category] ?? "elbiyahe-hero";
  return `/scenes/${name}.svg`;
}

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

function Stars({ value }: { value: number }) {
  return (
    <span className="rating" aria-label={`${value} out of 5`}>
      <Star size={14} fill="currentColor" /> {value.toFixed(1)}
    </span>
  );
}

/* ============================ EVENTS ============================ */

const EVENT_CATEGORIES = ["All", "Culture", "Sports", "Arts", "Community"] as const;
const EVENT_GROUPS: { key: EventRow["status"][]; label: string }[] = [
  { key: ["anytime"], label: "Anytime in Los Baños" },
  { key: ["live", "today"], label: "Today" },
  { key: ["week"], label: "This Week" },
  { key: ["season"], label: "This Season" },
  { key: ["recap"], label: "Past — Recaps" },
];

/* Decorative social-proof dots — NOT real people/photos. The app has no public
   attendee-identity data (RSVPs are private), so a stack of fabricated named
   avatars would be dishonest; these are purely visual texture next to the real
   attendee_count. */
const AVATAR_DOT_COLORS = ["#0e543c", "#d17b27", "#94603c", "#dba01c", "#377b8c"];
function AvatarDots({ seed = 0 }: { seed?: number }) {
  return (
    <span className="elbiyahe-avatar-dots" aria-hidden="true">
      {[0, 1, 2].map(i => <i key={i} style={{ background: AVATAR_DOT_COLORS[(seed + i) % AVATAR_DOT_COLORS.length] }} />)}
    </span>
  );
}

function EventCard({ e, Tag, index = 0 }: { e: EventRow; Tag: Shell["Tag"]; index?: number }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="elbiyahe-event-card">
      <button
        className={`elbiyahe-card-bookmark ${saved ? "on" : ""}`}
        aria-label={saved ? "Remove bookmark" : "Bookmark event"}
        onClick={() => { setSaved(v => !v); notify(saved ? "Removed from saved" : "Event bookmarked."); }}
      >
        <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
      </button>
      <Link href={`/events/${e.slug}`} className="elbiyahe-event-card-link">
        <div className="elbiyahe-event-card-media">
          <img src={e.hero_image || fallbackScene(e)} alt={e.title} />
          {e.status === "live" && <span className="elbiyahe-badge live">LIVE NOW</span>}
          {e.status === "recap" && <span className="elbiyahe-badge grey">RECAP</span>}
        </div>
        <div className="elbiyahe-event-card-body">
          <div className="elbiyahe-chip-row">
            <Tag>{e.category}</Tag>
            <span className="muted"><CalendarDays size={13} /> {e.date_label} · {e.time_label}</span>
          </div>
          <h3>{e.title}</h3>
          <p className="muted"><MapPin size={13} /> {e.venue_name}</p>
          {e.description && <p className="muted elbiyahe-event-card-desc">{e.description}</p>}
        </div>
      </Link>
      <div className="elbiyahe-event-card-footer">
        {e.status !== "anytime"
          ? <span className="elbiyahe-event-card-going"><AvatarDots seed={index} /> {e.attendee_count.toLocaleString()} going</span>
          : <span />}
        <Link href={`/events/${e.slug}`} className="btn primary">View Details</Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ hero carousel */
const HERO_SCENES = ["heritage", "sunset", "market", "falls"];
function EventHeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setI(v => (v + 1) % HERO_SCENES.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="elbiyahe-hero-carousel">
      <img src={`/scenes/elbiyahe-${HERO_SCENES[i]}.svg`} alt="" />
      <div className="elbiyahe-hero-carousel-dots">
        {HERO_SCENES.map((s, idx) => (
          <button key={s} aria-label={`Slide ${idx + 1}`} className={idx === i ? "active" : ""} onClick={() => setI(idx)} />
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- season card */
function SeasonCallout({ onSeeDetails }: { onSeeDetails: () => void }) {
  const { data: season } = useCurrentSeason();
  if (!season) return null;
  return (
    <div className="elbiyahe-season-callout">
      <span className="eyebrow">THIS SEASON</span>
      <div className="elbiyahe-season-callout-title">
        <b>{season.quarter}</b>
        <span>{season.name.replace(/^El-Biyahe!\s*/, "")}</span>
      </div>
      {season.blurb && <p>{season.blurb}</p>}
      <button className="btn outline" onClick={onSeeDetails}>See season details <ArrowRight size={14} /></button>
    </div>
  );
}

/* -------------------------------------------------------------- calendar widget */
const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => addDays(startOfDay(d), -d.getDay());
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function EventCalendarWidget({ events, onViewFullCalendar }: { events: EventRow[]; onViewFullCalendar: () => void }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hasEvent = (d: Date) => events.some(e => {
    if (!e.starts_at) return false;
    const start = startOfDay(new Date(e.starts_at));
    const end = e.ends_at ? startOfDay(new Date(e.ends_at)) : start;
    return d >= start && d <= end;
  });
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const monthLabel = sameMonth
    ? weekStart.toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : `${weekStart.toLocaleDateString("en-PH", { month: "short" })} – ${weekEnd.toLocaleDateString("en-PH", { month: "short", year: "numeric" })}`;
  return (
    <div className="elbiyahe-calendar-widget">
      <div className="elbiyahe-calendar-widget-head">
        <h4>EVENT CALENDAR</h4>
        <div className="elbiyahe-calendar-widget-nav">
          <button aria-label="Previous week" onClick={() => setWeekStart(w => addDays(w, -7))}><ChevronLeft size={14} /></button>
          <span>{monthLabel}</span>
          <button aria-label="Next week" onClick={() => setWeekStart(w => addDays(w, 7))}><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="elbiyahe-calendar-widget-grid">
        {DAY_LABELS.map(d => <span key={d} className="elbiyahe-calendar-widget-dow">{d}</span>)}
        {days.map(d => (
          <span key={d.toISOString()} className={`elbiyahe-calendar-widget-day ${sameDay(d, today) ? "today" : ""}`}>
            {d.getDate()}
            {hasEvent(d) && <i />}
          </span>
        ))}
      </div>
      <button className="link-accent" onClick={onViewFullCalendar}>View full calendar <ArrowRight size={13} /></button>
    </div>
  );
}

/* ----------------------------------------------------------- featured event */
function FeaturedEventCard({ events, Tag }: { events: EventRow[]; Tag: Shell["Tag"] }) {
  const featured = events.find(e => e.featured) ?? events.find(e => e.status === "live" || e.status === "today");
  if (!featured) return null;
  return (
    <div className="elbiyahe-featured-card">
      <span className="eyebrow">FEATURED EVENT</span>
      <div className="elbiyahe-featured-card-media">
        <img src={featured.hero_image || fallbackScene(featured)} alt={featured.title} />
      </div>
      <div className="elbiyahe-chip-row"><Tag>{featured.category}</Tag></div>
      <h3>{featured.title}</h3>
      <p className="muted"><CalendarDays size={13} /> {featured.date_label} · {featured.time_label}</p>
      <p className="muted"><MapPin size={13} /> {featured.venue_name}</p>
      {featured.status !== "anytime" && (
        <p className="muted"><AvatarDots seed={7} /> {featured.attendee_count.toLocaleString()} going</p>
      )}
      <Link href={`/events/${featured.slug}`} className="btn primary">RSVP Now</Link>
      <Link href={`/events/${featured.slug}`} className="btn outline">View Details</Link>
    </div>
  );
}

/* ------------------------------------------------------------- newsletter card */
function NewsletterCard() {
  const [email, setEmail] = useState("");
  return (
    <form
      className="elbiyahe-newsletter-card"
      onSubmit={ev => { ev.preventDefault(); if (email) { notify("You're subscribed. Come curious!"); setEmail(""); } }}
    >
      <h4>Never miss what's happening in LB!</h4>
      <p>Get updates on events and local spots.</p>
      <input type="email" required placeholder="Enter your email" value={email} onChange={ev => setEmail(ev.target.value)} aria-label="Email address" />
      <button className="btn primary" type="submit">Subscribe</button>
    </form>
  );
}

const DATE_FILTERS = ["all", "today", "week", "month", "custom"] as const;
const DATE_FILTER_LABEL: Record<(typeof DATE_FILTERS)[number], string> = {
  all: "All Dates", today: "Today", week: "This Week", month: "This Month", custom: "Custom Range",
};

export function EventsList({ Header, BottomNav, Footer, Button, Tag }: Shell) {
  const { data: events, isLoading, error } = useEvents();
  const { data: seasons } = useSeasons();
  const [category, setCategory] = useState<(typeof EVENT_CATEGORIES)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");
  const [season, setSeason] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"soonest" | "popular">("soonest");
  const [showFilters, setShowFilters] = useState(false);
  const isSearching = query.trim() !== "";

  const locations = useMemo(
    () => Array.from(new Set((events ?? []).map(e => e.barangay).filter((b): b is string => !!b))).sort(),
    [events],
  );

  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    if (dateFilter === "today") return [today, addDays(today, 1)] as const;
    if (dateFilter === "week") return [today, addDays(today, 7)] as const;
    if (dateFilter === "month") return [today, new Date(today.getFullYear(), today.getMonth() + 1, 0)] as const;
    if (dateFilter === "custom" && customFrom && customTo) return [new Date(customFrom), addDays(new Date(customTo), 1)] as const;
    return null;
  }, [dateFilter, customFrom, customTo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (events ?? []).filter(e => {
      if (category !== "All" && e.category !== category) return false;
      if (season !== "all" && e.season_key !== season) return false;
      if (location !== "all" && e.barangay !== location) return false;
      if (q && !`${e.title} ${e.venue_name ?? ""} ${e.description ?? ""}`.toLowerCase().includes(q)) return false;
      if (dateRange) {
        if (!e.starts_at) return false;
        const start = new Date(e.starts_at);
        const end = e.ends_at ? new Date(e.ends_at) : start;
        if (end < dateRange[0] || start >= dateRange[1]) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => sort === "popular"
      ? b.attendee_count - a.attendee_count
      : (a.starts_at ? new Date(a.starts_at).getTime() : Infinity) - (b.starts_at ? new Date(b.starts_at).getTime() : Infinity));
  }, [events, category, season, location, query, sort, dateRange]);

  const resetFilters = () => {
    setCategory("All"); setSeason("all"); setLocation("all");
    setDateFilter("all"); setCustomFrom(""); setCustomTo(""); setQuery("");
  };

  const seeSeasonDetails = () => {
    const current = (seasons ?? []).find(s => s.is_current);
    if (current) setSeason(current.key);
    document.getElementById("events-results")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <>
      <Header />
      <main className="container elbiyahe-page elbiyahe-events-page">
        <section className="elbiyahe-events-hero">
          <div className="elbiyahe-events-hero-intro">
            <p className="eyebrow">WHAT'S HAPPENING IN LB</p>
            <h1>Events</h1>
            <div className="script">Join what moves LB!</div>
            <p className="muted">From culture and sports to arts and community celebrations — discover events happening around Los Baños, Laguna.</p>
          </div>
          <EventHeroCarousel />
          <SeasonCallout onSeeDetails={seeSeasonDetails} />
        </section>

        <div className="elbiyahe-events-layout">
          <aside className={`filter-rail elbiyahe-events-filter-rail ${showFilters ? "open" : ""}`}>
            <div className="rail-title"><h3>Filter Events</h3><button className="link-accent" onClick={resetFilters}>Reset</button></div>
            <div className="searchbox elbiyahe-searchbox">
              <Search size={15} />
              <input aria-label="Search events" placeholder="Search events…" value={query} onChange={ev => setQuery(ev.target.value)} />
            </div>

            <div className="rail-title spaced"><h3>Date</h3></div>
            <div className="elbiyahe-radio-group">
              {DATE_FILTERS.map(d => (
                <label key={d} className="elbiyahe-radio">
                  <input type="radio" name="date-filter" checked={dateFilter === d} onChange={() => setDateFilter(d)} />
                  {DATE_FILTER_LABEL[d]}
                </label>
              ))}
              {dateFilter === "custom" && (
                <div className="elbiyahe-date-range">
                  <input type="date" aria-label="From date" value={customFrom} onChange={ev => setCustomFrom(ev.target.value)} />
                  <input type="date" aria-label="To date" value={customTo} onChange={ev => setCustomTo(ev.target.value)} />
                </div>
              )}
            </div>

            <div className="rail-title spaced"><h3>Category</h3></div>
            <div className="elbiyahe-radio-group">
              {EVENT_CATEGORIES.map(c => (
                <label key={c} className="elbiyahe-radio">
                  <input type="radio" name="category-filter" checked={category === c} onChange={() => setCategory(c)} />
                  {c === "All" ? "All Categories" : c}
                </label>
              ))}
            </div>

            <div className="rail-title spaced"><h3>Season</h3></div>
            <select className="elbiyahe-rail-select" value={season} onChange={ev => setSeason(ev.target.value)}>
              <option value="all">All seasons</option>
              {(seasons ?? []).map(s => <option key={s.key} value={s.key}>{s.quarter} · {s.name.replace(/^El-Biyahe!\s*/, "")}</option>)}
            </select>

            <div className="rail-title spaced"><h3>Location</h3></div>
            <label className="elbiyahe-rail-select-wrap">
              <MapPin size={14} />
              <select className="elbiyahe-rail-select" value={location} onChange={ev => setLocation(ev.target.value)}>
                <option value="all">All Locations</option>
                {locations.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>

            <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
          </aside>

          <section className="elbiyahe-events-main">
            <div className="elbiyahe-events-main-head" id="events-results">
              <p className="elbiyahe-results-count">{filtered.length} event{filtered.length === 1 ? "" : "s"} found</p>
              <div className="elbiyahe-events-main-controls">
                <button className="btn secondary elbiyahe-filters-toggle" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={15} /> Filters</button>
                <label className="elbiyahe-select">
                  Sort by
                  <select value={sort} onChange={ev => setSort(ev.target.value as typeof sort)}>
                    <option value="soonest">Soonest</option>
                    <option value="popular">Most popular</option>
                  </select>
                </label>
                <div className="elbiyahe-view-toggle">
                  <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={15} /> List</button>
                  <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}><MapPin size={15} /> Map</button>
                </div>
              </div>
            </div>

            {isLoading && <Loading />}
            {error && <LoadError message={(error as Error).message} />}

            {!isLoading && !error && (view === "map" ? (
              <MapView
                points={filtered.filter(e => e.lat != null && e.lng != null).map(e => ({ id: e.id, lat: e.lat!, lng: e.lng!, name: e.title, kind: e.category, href: `/events/${e.slug}`, sub: e.date_label ?? undefined }))}
                fitBounds height={480} ariaLabel="Map of Los Baños events"
              />
            ) : isSearching ? (
              <section className="elbiyahe-event-group">
                <h2>Search results</h2>
                <div className="elbiyahe-event-grid">
                  {filtered.map((e, i) => <EventCard key={e.id} e={e} Tag={Tag} index={i} />)}
                </div>
              </section>
            ) : (
              EVENT_GROUPS.map(group => {
                const items = filtered.filter(e => group.key.includes(e.status));
                if (!items.length) return null;
                return (
                  <section key={group.label} className="elbiyahe-event-group">
                    <h2>{group.label}</h2>
                    <div className="elbiyahe-event-grid">
                      {items.map((e, i) => <EventCard key={e.id} e={e} Tag={Tag} index={i} />)}
                    </div>
                  </section>
                );
              })
            ))}

            {!isLoading && !error && filtered.length === 0 && (
              <div className="empty-state">
                <CalendarDays size={26} />
                <h3>No events match those filters.</h3>
                <p>Try a different category, date, or location.</p>
                <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
              </div>
            )}
          </section>

          <aside className="elbiyahe-widget-rail">
            {!isLoading && !error && <FeaturedEventCard events={events ?? []} Tag={Tag} />}
            <NewsletterCard />
            {!isLoading && !error && <EventCalendarWidget events={events ?? []} onViewFullCalendar={() => setView("map")} />}
          </aside>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

export function EventDetail({ Header, BottomNav, Footer, Button, Tag, id }: Shell & { id?: string }) {
  const { data: e, isLoading, error } = useEvent(id);
  const seasonName = useSeasonName();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: rsvped } = useMyRsvp(e?.id);
  const toggleRsvp = useToggleRsvp(e?.id);
  const { data: passport } = usePassport();
  const [tab, setTab] = useState<"About" | "Schedule" | "Organizers" | "Updates">("About");
  const [saved, setSaved] = useState(false);

  if (isLoading) return <><Header /><main className="container elbiyahe-detail"><Loading /></main><Footer /><BottomNav /></>;
  if (error || !e) return <><Header /><main className="container elbiyahe-detail"><LoadError message={(error as Error)?.message} /></main><Footer /><BottomNav /></>;

  const past = e.status === "recap";
  const anytime = e.status === "anytime";
  const schedule = [...(e.event_schedule_items ?? [])].sort((a, b) => a.sort - b.sort);
  const updates = e.event_updates ?? [];
  const nearbyPassport = e.lat != null && e.lng != null
    ? (passport?.locations ?? [])
        .filter(l => l.lat != null && l.lng != null)
        .map(l => ({ loc: l, km: distanceKm({ lat: e.lat!, lng: e.lng! }, { lat: l.lat!, lng: l.lng! }) }))
        .filter(x => x.km <= 5)
        .sort((a, b) => a.km - b.km)
        .slice(0, 3)
    : [];

  const onRsvp = () => {
    if (!user) { navigate(`/login?next=/events/${e.slug}`); return; }
    toggleRsvp.mutate(!rsvped, {
      onSuccess: going => notify(going ? "You're going! RSVP saved." : "RSVP cancelled"),
      onError: err => notify(err.message),
    });
  };

  return (
    <>
      <Header />
      <main className="container elbiyahe-detail">
        <Link href="/events" className="back-link"><ArrowLeft size={16} /> Back to Events</Link>

        <section className="elbiyahe-detail-hero">
          <img src={e.hero_image || fallbackScene(e)} alt={e.title} />
          {e.status === "live" && <span className="elbiyahe-badge live">LIVE NOW</span>}
          {past && <span className="elbiyahe-badge grey">EVENT RECAP</span>}
          <div className="elbiyahe-detail-hero-actions">
            <button aria-label="Save event" className={saved ? "on" : ""} onClick={() => { setSaved(v => !v); notify(saved ? "Removed from saved" : "Saved for later"); }}>
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
            </button>
            <button aria-label="Share event" onClick={() => notify("Event link copied to clipboard.")}><Share2 size={17} /></button>
          </div>
        </section>

        <div className="elbiyahe-chip-row">
          <Tag>{e.category}</Tag>
          {e.season_key && <Tag tone="ochre">{seasonName(e.season_key)}</Tag>}
        </div>
        <h1>{e.title}</h1>
        <div className="elbiyahe-detail-facts">
          <span><CalendarDays size={15} /> {e.date_label} · {e.time_label}</span>
          <span><MapPin size={15} /> {e.venue_name}{e.barangay ? `, Brgy. ${e.barangay}` : ""}</span>
          {!anytime && <span><Users size={15} /> {e.attendee_count.toLocaleString()} going</span>}
        </div>

        {!past && !anytime && (
          <div className="elbiyahe-rsvp-row">
            <button className={`elbiyahe-rsvp ${rsvped ? "done" : ""}`} disabled={toggleRsvp.isPending} onClick={onRsvp}>
              {rsvped ? <><Check size={17} /> You're going</> : "RSVP to this event"}
            </button>
            <button className="elbiyahe-bookmark" aria-label="Bookmark event" onClick={() => notify("Event bookmarked.")}><Bookmark size={17} /></button>
          </div>
        )}
        {anytime && (
          <div className="elbiyahe-rsvp-row">
            <button className="elbiyahe-bookmark wide" onClick={() => notify("Event bookmarked.")}><Bookmark size={17} /> Save for later</button>
          </div>
        )}

        <div className="elbiyahe-tabs">
          {(["About", "Schedule", "Organizers", "Updates"] as const).map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="elbiyahe-tab-body">
          {tab === "About" && <p>{e.description}</p>}
          {tab === "Schedule" && (
            schedule.length ? (
              <ol className="elbiyahe-schedule">
                {schedule.map(s => (
                  <li key={s.id} className={s.state ?? ""}>
                    <span className="elbiyahe-schedule-time">{s.time_label}</span>
                    <span>{s.item}</span>
                    {s.state === "live" && <span className="elbiyahe-badge live sm">LIVE</span>}
                    {s.state === "done" && <span className="elbiyahe-badge grey sm">DONE</span>}
                  </li>
                ))}
              </ol>
            ) : <p className="muted">Full schedule to be announced.</p>
          )}
          {tab === "Organizers" && <div className="elbiyahe-organizer"><BadgeCheck size={18} /> <span>{e.organizer}</span></div>}
          {tab === "Updates" && (
            updates.length ? updates.map(u => (
              <div key={u.id} className="elbiyahe-update"><b>{u.ago_label}</b><p>{u.body}</p></div>
            )) : <p className="muted">No updates yet. Check back closer to the date.</p>
          )}
        </div>

        {e.lat != null && e.lng != null && (
          <section className="elbiyahe-location-section">
            <h2>Getting there</h2>
            <MapView points={[{ id: e.id, lat: e.lat, lng: e.lng, name: e.venue_name ?? e.title, kind: "Event", sub: e.date_label ?? undefined }]} interactive={false} height={220} ariaLabel={`Map showing ${e.venue_name ?? e.title}`} />
            <Button onClick={() => window.open(directionsUrl(e.lat!, e.lng!), "_blank", "noopener")}><Navigation size={15} /> Get directions</Button>
          </section>
        )}

        {e.slug === "los-banos-heritage-walk" && (
          <section className="elbiyahe-location-section">
            <h2>The full trail</h2>
            <p className="muted">All 17 stops, grouped by era, with a map, route line, and directions to each site.</p>
            <Button href="/heritage-walk"><Footprints size={15} /> See the full 17-stop trail</Button>
          </section>
        )}

        <section className="elbiyahe-complete-visit">
          <h2>Complete Your Visit</h2>
          <div className="elbiyahe-cv-grid">
            <Link href="/stay-eat" className="elbiyahe-cv-item"><Utensils size={18} /> Eat Nearby</Link>
            <Link href="/stay-eat" className="elbiyahe-cv-item"><Bookmark size={18} /> Stay Nearby</Link>
            <Link href="/ride-guide" className="elbiyahe-cv-item"><Navigation size={18} /> How to Get Here</Link>
            <Link href="/explore" className="elbiyahe-cv-item"><Compass size={18} /> Explore Nearby</Link>
          </div>
        </section>

        {nearbyPassport.length > 0 ? (
          <section className="elbiyahe-location-section">
            <h2>Nearby Passport Spots</h2>
            <div className="elbiyahe-nearby-passport-grid">
              {nearbyPassport.map(({ loc, km }) => (
                <Link href="/passport" key={loc.id} className="elbiyahe-nearby-passport-card">
                  <QrCode size={16} />
                  <div><b>{loc.name}</b><small>{loc.category} · {formatDistance(km)} away</small></div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <Link href="/passport" className="elbiyahe-passport-teaser">
            <QrCode size={20} />
            <span><b>Passport Spots</b><small>Collect stamps around Los Baños in your Digital LB Passport</small></span>
            <ChevronRight size={18} />
          </Link>
        )}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

/* ============================ BUS TOURS ============================ */

type TourTheme = "Nature" | "Culture" | "Food" | "Science";
const TOUR_THEMES: { key: TourTheme; icon: typeof Leaf; tone: string }[] = [
  { key: "Nature", icon: Leaf, tone: "var(--forest)" },
  { key: "Culture", icon: Landmark, tone: "var(--maroon)" },
  { key: "Food", icon: Utensils, tone: "var(--ochre)" },
  { key: "Science", icon: Atom, tone: "var(--teal)" },
];
const TOUR_AUDIENCE: { key: string; icon: typeof User }[] = [
  { key: "Solo", icon: User }, { key: "Couple", icon: Heart },
  { key: "Family", icon: Users }, { key: "Group", icon: UsersRound },
];
const TOUR_DURATIONS: { key: string; icon: typeof Sun }[] = [
  { key: "Half Day", icon: Sun }, { key: "Full Day", icon: Clock3 },
];
const isHalfDay = (d: string | null) => !!d && /half/i.test(d);

const TOUR_GUIDES: { title: string; body: string; theme: TourTheme; href?: string }[] = [
  { title: "Nature & Trails", body: "Makiling slopes, falls, and crater lakes", theme: "Nature" },
  { title: "Heritage Walk", body: "The poblacion's churches and old stations", theme: "Culture", href: "/heritage-walk" },
  { title: "Food Trips", body: "Buko pie, kesong puti, and market finds", theme: "Food" },
  { title: "Science & Campus", body: "UPLB, IRRI, and the Museum of Natural History", theme: "Science" },
];
const MOOD_TILES: { theme: TourTheme; photo: string; title: string; body: string }[] = [
  { theme: "Nature", photo: "/tours/misty-mountains.jpg", title: "Chase the outdoors", body: "Trails, waterfalls, and lakeside views." },
  { theme: "Culture", photo: "/tours/church-golden.jpg", title: "Walk through history", body: "Colonial churches and heritage streets." },
  { theme: "Food", photo: "/tours/food-spread-alt.jpg", title: "Eat your way around", body: "Local classics, stop by stop." },
  { theme: "Science", photo: "/tours/uplb-campus.jpg", title: "Discover how it works", body: "Campus science and living museums." },
];
const DAY_EASE: { icon: typeof Bus; label: string; body: string }[] = [
  { icon: Bus, label: "Transport", body: "Air-conditioned coach from your pickup point and back." },
  { icon: Compass, label: "Local Guide", body: "A licensed guide who knows the stories behind each stop." },
  { icon: Route, label: "Curated Stops", body: "A day planned so you see more and rush less." },
  { icon: Sparkles, label: "Local Experiences", body: "Tastings, walks, and moments you'd miss on your own." },
];

const scrollToResults = () =>
  document.getElementById("tours-results")?.scrollIntoView({ behavior: "smooth", block: "start" });

function TourCard({ t, saved, onToggleSave }: {
  t: TourListItem;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const stopNames = t.stops.map(s => s.name).filter(n => !/^lunch/i.test(n));
  return (
    <article className="elbiyahe-tour-card is-rich">
      <div className="elbiyahe-tour-card-media">
        <img src={t.hero_image || "/tours/bus-on-road.jpg"} alt={t.title} loading="lazy" />
        {t.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}
        <button
          type="button"
          className={`elbiyahe-tour-card-heart${saved ? " is-saved" : ""}`}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save this tour"}
          onClick={onToggleSave}
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="elbiyahe-tour-card-body">
        <div className="elbiyahe-chip-row">
          {t.tags.map(tag => <span key={tag} className={`tag tone-${tag.toLowerCase()}`}>{tag}</span>)}
        </div>
        <h3><Link href={`/tours/${t.slug}`}>{t.title}</Link></h3>
        <p className="muted elbiyahe-tour-card-meta">
          <span><Clock3 size={13} /> {t.duration}</span>
          <span><Bus size={13} /> Bus Tour</span>
          <span><MapPin size={13} /> {t.stops.length} Stops</span>
        </p>
        {stopNames.length > 0 && (
          <p className="muted elbiyahe-tour-card-stops">{stopNames.slice(0, 3).join(" · ")}{stopNames.length > 3 ? " …" : ""}</p>
        )}
        <div className="elbiyahe-tour-card-foot">
          <b>{peso(t.price_per_seat)}<small> /seat</small></b>
          <Rating value={t.rating} count={t.review_count} />
        </div>
        <Link href={`/tours/${t.slug}`} className="btn outline elbiyahe-tour-card-cta">View Tour <ArrowRight size={15} /></Link>
      </div>
    </article>
  );
}

export function BusTours({ Header, BottomNav, Footer, Button }: Shell) {
  const { data: tours, isLoading, error } = useTours();
  const [theme, setTheme] = useState<TourTheme | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const all = tours ?? [];
  const featured = all.find(t => t.featured) ?? all[0] ?? null;
  const list = all.filter(t =>
    (!theme || t.tags.includes(theme)) &&
    (!duration || (duration === "Half Day" ? isHalfDay(t.duration) : !isHalfDay(t.duration))),
  );
  const pickTheme = (k: TourTheme) => { setTheme(cur => (cur === k ? null : k)); scrollToResults(); };
  const toggleSave = (id: string) =>
    setSaved(cur => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const resetFilters = () => { setTheme(null); setAudience(null); setDuration(null); };

  const lunchLine = featured?.includes.find(i => /lunch|merienda|meal|tasting/i.test(i)) ?? "Lunch stop included";

  return (
    <>
      <Header />
      <main className="container elbiyahe-page elbiyahe-tours-page">
        {/* 1 — HERO */}
        <section className="elbiyahe-tours-hero">
          <div className="elbiyahe-tours-hero-card" style={{ ["--hero-photo" as any]: "url(/tours/hero-bus-lake.jpg)" }}>
            <p className="eyebrow">SEE MORE, STRESS LESS</p>
            <h1>Explore Los Baños by bus.</h1>
            <p>Curated day tours with a coach, a guide, and every stop planned — built for visitors coming in from other cities.</p>
            <div className="elbiyahe-tours-hero-cta">
              <Button variant="soft" onClick={scrollToResults}>Explore Tours <ArrowRight size={15} /></Button>
              <button type="button" className="btn outline elbiyahe-tours-hero-plan" onClick={() => document.getElementById("tours-planner")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                <CalendarDays size={15} /> Plan My Day
              </button>
            </div>
          </div>

          <div className="elbiyahe-tours-guides">
            <div className="elbiyahe-row-head">
              <h2>Quick Tour Guides</h2>
              <button type="button" className="link-accent" onClick={() => { resetFilters(); scrollToResults(); }}>See all <ArrowRight size={13} /></button>
            </div>
            {TOUR_GUIDES.map(g => {
              const th = TOUR_THEMES.find(t => t.key === g.theme)!;
              const Icon = th.icon;
              const inner = (
                <>
                  <span className="elbiyahe-tours-guide-icon" style={{ background: th.tone }}><Icon size={16} /></span>
                  <span className="elbiyahe-tours-guide-text"><b>{g.title}</b><small>{g.body}</small></span>
                  <ChevronRight size={16} />
                </>
              );
              return g.href
                ? <Link key={g.title} href={g.href} className="elbiyahe-tours-guide-row">{inner}</Link>
                : <button key={g.title} type="button" className="elbiyahe-tours-guide-row" onClick={() => pickTheme(g.theme)}>{inner}</button>;
            })}
          </div>
        </section>

        {/* 2 — FILTER BAR */}
        <section className="elbiyahe-tours-filterbar" aria-label="Find your tour">
          <div className="elbiyahe-tours-filter-intro">
            <span className="elbiyahe-tours-filter-intro-icon"><Compass size={20} /></span>
            <div><b>Find your tour</b><small>Tell us your day and we'll narrow it down.</small></div>
          </div>
          <div className="elbiyahe-tours-filter-group">
            <label>Who are you traveling with?</label>
            <div className="filter-pills">
              {TOUR_AUDIENCE.map(a => {
                const Icon = a.icon;
                return <button key={a.key} type="button" className={audience === a.key ? "active" : ""} onClick={() => setAudience(cur => (cur === a.key ? null : a.key))}><Icon size={14} /> {a.key}</button>;
              })}
            </div>
          </div>
          <div className="elbiyahe-tours-filter-group">
            <label>What kind of day?</label>
            <div className="filter-pills">
              {TOUR_THEMES.map(th => {
                const Icon = th.icon;
                return <button key={th.key} type="button" className={theme === th.key ? "active" : ""} onClick={() => setTheme(cur => (cur === th.key ? null : th.key))}><Icon size={14} /> {th.key}</button>;
              })}
            </div>
          </div>
          <div className="elbiyahe-tours-filter-group">
            <label>How much time?</label>
            <div className="filter-pills">
              {TOUR_DURATIONS.map(d => {
                const Icon = d.icon;
                return <button key={d.key} type="button" className={duration === d.key ? "active" : ""} onClick={() => setDuration(cur => (cur === d.key ? null : d.key))}><Icon size={14} /> {d.key}</button>;
              })}
            </div>
          </div>
          <Button onClick={scrollToResults}>Find My Tour <ArrowRight size={15} /></Button>
        </section>

        {/* 3 — POPULAR TOURS + PLANNER */}
        <div className="elbiyahe-tours-body" id="tours-results">
          <section className="elbiyahe-tours-main">
            <div className="elbiyahe-row-head">
              <h2>Popular Tours</h2>
              {(theme || duration) && <button type="button" className="link-accent" onClick={resetFilters}>See all tours <ArrowRight size={13} /></button>}
            </div>
            {isLoading && <Loading />}
            {error && <LoadError message={(error as Error).message} />}
            {!isLoading && !error && (
              list.length > 0 ? (
                <div className="elbiyahe-tour-grid">
                  {list.map(t => <TourCard key={t.id} t={t} saved={saved.has(t.id)} onToggleSave={() => toggleSave(t.id)} />)}
                </div>
              ) : (
                <div className="empty-state">
                  <Bus size={26} /><h3>No tours match that yet.</h3><p>Try a different day or theme.</p>
                  <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
                </div>
              )
            )}
          </section>

          {featured && (
            <aside className="elbiyahe-tours-planner" id="tours-planner">
              <span className="eyebrow">PLAN YOUR LOS BAÑOS DAY</span>
              <ol className="elbiyahe-tours-timeline">
                {featured.stops.map(s => (
                  <li key={s.sort}><span className="elbiyahe-tours-timeline-dot" /><b>{s.time_label}</b><span>{s.name}</span></li>
                ))}
              </ol>
              <div className="elbiyahe-tours-yourday">
                <b>YOUR DAY</b>
                <p><MapPin size={14} /> {featured.stops.length} destinations</p>
                <p><Bus size={14} /> Transport included</p>
                <p><Utensils size={14} /> {lunchLine}</p>
                <p><Clock3 size={14} /> {featured.duration}</p>
              </div>
              <p className="elbiyahe-tours-planner-price">From {peso(featured.price_per_seat)}/person</p>
              <Button href={`/tours/${featured.slug}`}>Build This Trip <ArrowRight size={15} /></Button>
            </aside>
          )}
        </div>

        {/* 4 — MOOD TILES */}
        <section className="elbiyahe-tours-moods">
          <span className="eyebrow">WHAT ARE YOU IN THE MOOD FOR?</span>
          <div className="elbiyahe-tours-mood-grid">
            {MOOD_TILES.map(m => {
              const th = TOUR_THEMES.find(t => t.key === m.theme)!;
              const Icon = th.icon;
              return (
                <button key={m.theme} type="button" className="elbiyahe-tours-mood-tile" onClick={() => pickTheme(m.theme)}
                  style={{ ["--tile-photo" as any]: `url(${m.photo})` }}>
                  <span className="elbiyahe-tours-mood-icon" style={{ background: th.tone }}><Icon size={15} /></span>
                  <span className="elbiyahe-tours-mood-copy">
                    <small>{m.theme}</small>
                    <b>{m.title}</b>
                    <span>{m.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5 — BANNER ROW */}
        <section className="elbiyahe-tours-banners">
          {featured && (
            <div className="elbiyahe-tours-weekend" style={{ ["--hero-photo" as any]: "url(/tours/bus-on-road.jpg)" }}>
              <p className="eyebrow">WEEKEND PICK</p>
              <h3>{featured.title}</h3>
              <p>{featured.summary}</p>
              <p className="elbiyahe-tours-weekend-price">{peso(featured.price_per_seat)}/person</p>
              <Link href={`/tours/${featured.slug}`} className="btn soft">Explore Tour <ArrowRight size={14} /></Link>
            </div>
          )}

          <div className="elbiyahe-tours-ease">
            <h3>Every tour is designed to make your day easier</h3>
            <div className="elbiyahe-tours-ease-grid">
              {DAY_EASE.map(d => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="elbiyahe-tours-ease-item">
                    <span className="elbiyahe-tours-ease-icon"><Icon size={18} /></span>
                    <b>{d.label}</b>
                    <small>{d.body}</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="elbiyahe-tours-passport">
            <p className="eyebrow">COLLECT. EAT. EARN!</p>
            <p>Explore Los Baños with your LB Passport and earn rewards along the way.</p>
            <Link href="/passport" className="btn soft">Learn More <ArrowRight size={14} /></Link>
            <img src="/tours/passport-illustration.png" alt="" className="elbiyahe-tours-passport-art" />
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

export function TourDetail({ Header, BottomNav, Footer, Button, Tag, id }: Shell & { id?: string }) {
  const { data: t, isLoading, error } = useTour(id);
  const seasonName = useSeasonName();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const reserve = useReserveTour();

  if (isLoading) return <><Header /><main className="container elbiyahe-detail"><Loading /></main><Footer /><BottomNav /></>;
  if (error || !t) return <><Header /><main className="container elbiyahe-detail"><LoadError message={(error as Error)?.message} /></main><Footer /><BottomNav /></>;

  const stops = [...(t.tour_itinerary_stops ?? [])].sort((a, b) => a.sort - b.sort);
  const reviews = t.tour_reviews ?? [];
  const soldOutSoon = t.seats_available <= 10;

  const onReserve = () => {
    if (!user) { navigate(`/login?next=/tours/${t.slug}`); return; }
    reserve.mutate(
      { id: t.id, reserve_url: t.reserve_url, title: t.title, operator_name: t.tour_operators?.name },
      {
        onSuccess: () => notify("Opening the tour operator's booking channel — El-Biyahe! never processes payment."),
        onError: err => notify(err.message),
      },
    );
  };

  return (
    <>
      <Header />
      <main className="container elbiyahe-detail">
        <Link href="/tours" className="back-link"><ArrowLeft size={16} /> Back to Bus Tours</Link>

        <section className="elbiyahe-detail-hero">
          <img src={t.hero_image || "/scenes/elbiyahe-bus.svg"} alt={t.title} />
          {t.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}
        </section>

        <div className="elbiyahe-chip-row">
          {t.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          {t.season_key && <Tag tone="ochre">{seasonName(t.season_key)} season</Tag>}
        </div>
        <h1>{t.title}</h1>
        <p className="muted"><Bus size={14} /> Operated by {t.tour_operators?.name}</p>
        <p>{t.summary}</p>

        <div className="elbiyahe-tour-meta">
          <div><b>{peso(t.price_per_seat)}</b><small>per seat</small></div>
          <div><b>{t.duration}</b><small>duration</small></div>
          <div><b>{t.rating != null ? `${Number(t.rating).toFixed(1)} ★` : "—"}</b><small>{t.review_count ?? 0} reviews</small></div>
          <div><b className={soldOutSoon ? "warn" : ""}>{t.seats_available}</b><small>of {t.seat_capacity} seats left</small></div>
        </div>

        <div className="elbiyahe-tour-logistics">
          <div>
            <h3><MapPin size={15} /> Pickup points</h3>
            <ul>{t.origin_pickup_points.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <h3><CalendarDays size={15} /> Departures</h3>
            <p>{t.departure_schedule}</p>
          </div>
          <div>
            <h3><Check size={15} /> What's included</h3>
            <ul>{t.includes.map(i => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>

        <section className="elbiyahe-itinerary">
          <h2>Itinerary</h2>
          {stops.some(s => s.lat != null && s.lng != null) && (
            <MapView
              points={stops.filter(s => s.lat != null && s.lng != null).map((s, i) => ({ id: s.id, lat: s.lat!, lng: s.lng!, name: `${i + 1}. ${s.name}`, kind: "Attractions", sub: s.time_label }))}
              fitBounds height={280} ariaLabel={`Map of ${t.title} stops`}
            />
          )}
          <ol>
            {stops.map(s => (
              <li key={s.id}>
                <span className="elbiyahe-itinerary-time">{s.time_label}</span>
                <div><b>{s.name}</b><p className="muted">{s.blurb}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <div className="elbiyahe-reserve-bar">
          <div>
            <b>{peso(t.price_per_seat)} <small>/ seat</small></b>
            <small className="muted">{t.seats_available} seats left · referral booking</small>
          </div>
          <Button onClick={onReserve} disabled={reserve.isPending}><Ticket size={16} /> Reserve Seat</Button>
        </div>
        <p className="elbiyahe-referral-note"><ExternalLink size={13} /> Reserving opens {t.tour_operators?.name}'s own booking channel. El-Biyahe! logs the referral but never processes payment.</p>

        <section className="elbiyahe-reviews">
          <h2>Reviews</h2>
          {reviews.map(r => (
            <div key={r.id} className="elbiyahe-review">
              <div className="elbiyahe-review-head"><b>{r.author_name}</b><Stars value={r.rating} /></div>
              <p>{r.body}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

/* ============================ PASSPORT ============================ */

const STAMP_TONE: Record<StampCategory, string> = {
  Nature: "sage", Culture: "maroon", Food: "gold", Science: "teal", Event: "maroon", Community: "gold",
};
const DOT_CLASS: Record<string, string> = { Nature: "nature", Culture: "culture", Food: "food", Science: "gem", Event: "culture", Community: "gem" };
export const TONE_HEX: Record<string, string> = { sage: "#2f6b4f", maroon: "#6d2740", gold: "#c9971f", teal: "#2f6b4f" };

const TIER_THRESHOLDS = [0, 100, 300] as const;
export const TIER_NAMES = ["", "Explorer", "Local Insider", "Completionist"] as const;
const tierFor = (level: number) => TIER_NAMES[Math.min(Math.max(level, 1), 3)];
const nextTier = (xp: number) => {
  const idx = TIER_THRESHOLDS.findIndex(t => xp < t);
  return idx === -1 ? null : { name: TIER_NAMES[idx + 1] ?? TIER_NAMES[3], at: TIER_THRESHOLDS[idx] };
};

/** Deterministic string hash — same seed always renders the same badge, no Math.random(). */
function hashSeed(s: string): number {
  return Math.abs(s.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
}

export function StampBadge({ seed, category, state, size = 88 }: { seed: string; category: StampCategory; state: "collected" | "locked" | "mystery"; size?: number }) {
  if (state === "mystery") {
    return (
      <div className="elbiyahe-stamp-badge" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} fill="none">
          <circle cx={50} cy={50} r={46} stroke="var(--muted)" strokeWidth={2} strokeDasharray="6 5" />
          <text x={50} y={62} textAnchor="middle" fontSize={40} fontWeight={800} fill="var(--muted)">?</text>
        </svg>
      </div>
    );
  }

  const hash = hashSeed(seed);
  const tone = TONE_HEX[STAMP_TONE[category]] ?? "#0e543c";
  const ringCount = (hash % 3) + 1;
  const rotation = hash % 360;
  const shapeIndex = hash % 4;
  const cx = 50, cy = 50, r = 20;

  const innerShape = () => {
    if (shapeIndex === 0) {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
      }).join(" ");
      return <polygon points={pts} />;
    }
    if (shapeIndex === 1) {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
      return <polygon points={pts} />;
    }
    if (shapeIndex === 2) {
      return (
        <>
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
          <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
          <circle cx={cx} cy={cy} r={r * 0.9} />
        </>
      );
    }
    const pts = Array.from({ length: 3 }, (_, i) => {
      const a = (2 * Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    return (
      <>
        <circle cx={cx} cy={cy} r={r + 4} />
        <polygon points={pts} />
      </>
    );
  };

  return (
    <div className={`elbiyahe-stamp-badge ${state === "locked" ? "locked" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={tone} strokeWidth={2}>
        <circle cx={50} cy={50} r={46} />
        {ringCount >= 2 && <circle cx={50} cy={50} r={40} />}
        {ringCount >= 3 && <circle cx={50} cy={50} r={34} />}
        <g transform={`rotate(${rotation} 50 50)`}>{innerShape()}</g>
        <text x={50} y={90} textAnchor="middle" fontSize={9} fontWeight={800} fill={tone} stroke="none" letterSpacing={1}>
          {category.slice(0, 3).toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

export function WaxSealMark({ size = 84 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" className="elbiyahe-wax-seal">
      <circle cx={50} cy={50} r={44} fill="var(--ochre)" opacity={0.95} />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="3 3" />
      <polygon points="50,26 56,42 73,42 59,52 64,68 50,58 36,68 41,52 27,42 44,42" fill="#fff" opacity={0.9} />
    </svg>
  );
}

function SkylineMotif({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 60" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
      <rect x="0" y="30" width="18" height="30" /><rect x="22" y="18" width="14" height="42" />
      <rect x="40" y="34" width="20" height="26" /><circle cx="80" cy="14" r="10" />
      <rect x="100" y="10" width="8" height="50" /><rect x="112" y="24" width="16" height="36" />
      <rect x="132" y="16" width="10" height="44" /><rect x="150" y="36" width="22" height="24" />
      <path d="M180 60 Q186 28 195 20 Q198 34 192 60Z" /><path d="M200 60 Q206 30 216 22 Q218 36 210 60Z" />
      <rect x="230" y="20" width="12" height="40" /><rect x="246" y="32" width="18" height="28" />
      <rect x="268" y="14" width="10" height="46" /><rect x="282" y="28" width="16" height="32" />
    </svg>
  );
}

function IdentityQr({ payload }: { payload: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => { QRCode.toDataURL(payload, { width: 160, margin: 1 }).then(setUrl).catch(() => setUrl("")); }, [payload]);
  return (
    <div className="elbiyahe-identity-qr">
      {url ? <img src={url} alt="Your Passport ID QR" /> : <div className="elbiyahe-identity-qr-placeholder" />}
      <small>PASSPORT ID · {payload.slice(0, 8).toUpperCase()}</small>
    </div>
  );
}

function PassportCard({ displayName, xp, explorerLevel, joinedAt }: { displayName: string | null; xp: number; explorerLevel: number; joinedAt: string | null }) {
  const initial = (displayName ?? "?").charAt(0).toUpperCase();
  const next = nextTier(xp);
  const pct = next ? Math.round((xp / next.at) * 100) : 100;
  const joined = joinedAt ? new Date(joinedAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" }) : null;
  return (
    <section className="elbiyahe-passport-card">
      <div className="elbiyahe-passport-card-id">
        <span className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{initial}</span>
        <div>
          <b>{displayName || "Explorer"}</b>
          <span className="elbiyahe-badge ochre">{tierFor(explorerLevel).toUpperCase()}</span>
          {joined && <small className="muted">Member since {joined}</small>}
        </div>
      </div>
      <div className="elbiyahe-passport-card-progress">
        <IdentityQr payload={`${displayName ?? "explorer"}-${xp}`} />
        <div className="elbiyahe-passport-card-xp">
          <div className="progress"><span style={{ width: `${pct}%` }} /></div>
          <small className="muted">
            {next ? `${xp} XP · ${next.at - xp} XP to ${next.name}` : `${xp} XP · Max tier reached`}
          </small>
        </div>
      </div>
    </section>
  );
}

function PassportStats({ stampsCollected, xp, eventsJoinedCount }: { stampsCollected: number; xp: number; eventsJoinedCount: number }) {
  return (
    <div className="elbiyahe-passport-stats-grid">
      <div><b>{stampsCollected}</b><span>Stamps Collected</span></div>
      <div><b>{xp}</b><span>Total XP</span></div>
      <div><b>{stampsCollected}</b><span>Places Visited</span></div>
      <div><b>{eventsJoinedCount}</b><span>Events Joined</span></div>
    </div>
  );
}

function ShareJourneyCallout() {
  const onShare = async () => {
    const shareData = { title: "My LB Passport", text: "Come explore Los Baños with me on El-Biyahe!", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(shareData.url); notify("Link copied — share your passport!"); }
    } catch { /* user cancelled the native share sheet — not an error */ }
  };
  return (
    <div className="elbiyahe-share-row">
      <span className="muted">Proud of your progress? Show it off.</span>
      <button className="btn secondary sm" onClick={onShare}><Share2 size={14} /> Share Passport</button>
    </div>
  );
}

function MyStampsGrid({ locations, scannedLocationIds }: { locations: PassportLocationPublic[]; scannedLocationIds: string[] }) {
  const scanned = new Set(scannedLocationIds);
  const known = locations.filter(l => !l.is_mystery);
  const mystery = locations.find(l => l.is_mystery);
  return (
    <section className="elbiyahe-event-group">
      <div className="elbiyahe-row-head"><h2>MY STAMPS</h2><span className="muted">{scannedLocationIds.length}/{locations.length} collected</span></div>
      <div className="elbiyahe-stamps-grid">
        {known.map(l => (
          <div key={l.id} className="elbiyahe-stamp-slot">
            <StampBadge seed={l.slug} category={l.category} state={scanned.has(l.id) ? "collected" : "locked"} />
            <small>{l.name}</small>
          </div>
        ))}
        {mystery && (
          <div key={mystery.id} className="elbiyahe-stamp-slot">
            <StampBadge seed={mystery.slug} category={mystery.category} state={scanned.has(mystery.id) ? "collected" : "mystery"} />
            <small>{scanned.has(mystery.id) ? mystery.name : "??? · scan to reveal"}</small>
          </div>
        )}
      </div>
    </section>
  );
}

function PassportMissionsList({ missions, progressByMissionId, completedMissionIds, onClaim, claiming }: {
  missions: PassportMission[]; progressByMissionId: Record<string, number>; completedMissionIds: string[];
  onClaim: (id: string) => void; claiming: boolean;
}) {
  if (!missions.length) return null;
  return (
    <section className="elbiyahe-event-group">
      <h2>PASSPORT MISSIONS</h2>
      <div className="elbiyahe-missions-list">
        {missions.map(m => {
          const progress = Math.min(progressByMissionId[m.id] ?? 0, m.target_count);
          const done = completedMissionIds.includes(m.id);
          const ready = progress >= m.target_count && !done;
          return (
            <div key={m.id} className="elbiyahe-mission-card">
              <div className="elbiyahe-mission-card-head">
                <div><b>{m.title}</b><p className="muted">{m.description}</p></div>
                <span className="elbiyahe-badge sm">+{m.xp_reward} XP</span>
              </div>
              <div className="progress"><span style={{ width: `${(progress / m.target_count) * 100}%` }} /></div>
              <div className="elbiyahe-mission-card-foot">
                <small className="muted">{progress}/{m.target_count}</small>
                {done ? (
                  <span className="elbiyahe-reward-state">Completed</span>
                ) : ready ? (
                  <button className="btn sm" disabled={claiming} onClick={() => onClaim(m.id)}>Claim +{m.xp_reward} XP</button>
                ) : (
                  <span className="elbiyahe-reward-state">In Progress</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EncouragementBanner({ displayName, xp }: { displayName: string | null; xp: number }) {
  const next = nextTier(xp);
  return (
    <div className="elbiyahe-passport-banner">
      <SkylineMotif className="elbiyahe-skyline-motif" />
      <Sparkles size={22} />
      <div>
        <b>Keep going, {displayName || "Explorer"}!</b>
        <p>{next ? `${next.at - xp} more XP to reach ${next.name}.` : "You've reached the top tier — Completionist!"}</p>
      </div>
    </div>
  );
}

function RedeemRewardsPanel({ rewards, stampsCollected }: { rewards: PassportReward[]; stampsCollected: number }) {
  return (
    <div className="elbiyahe-featured-card">
      <span className="eyebrow"><Gift size={14} /> REDEEM REWARDS</span>
      {rewards.length === 0 && <p className="muted" style={{ fontSize: 12 }}>No rewards available yet.</p>}
      {rewards.map(r => {
        const unlocked = stampsCollected >= r.required_stamps;
        return (
          <div key={r.id} className={`elbiyahe-reward ${unlocked ? "" : "locked"}`}>
            <Ticket size={16} />
            <div>
              <b>{r.title}</b>
              <small>{unlocked ? r.description : `Unlock at ${r.required_stamps} stamps`}</small>
            </div>
            <span className="elbiyahe-reward-state">{unlocked ? "Ready" : "Locked"}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardPanel({ top, me, meInTop }: { top: LeaderboardRow[]; me: (LeaderboardRow & { rank: number }) | null; meInTop: boolean }) {
  return (
    <div className="elbiyahe-featured-card">
      <span className="eyebrow"><Trophy size={14} /> LEADERBOARD</span>
      {top.length === 0 && <p className="muted" style={{ fontSize: 12 }}>Be the first explorer to earn XP!</p>}
      {top.map((row, i) => (
        <div key={row.id} className="elbiyahe-leaderboard-row">
          <b>#{i + 1}</b>
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{(row.display_name ?? "?").charAt(0).toUpperCase()}</span>
          <div><b>{row.display_name || "Explorer"}</b><small className="muted">{tierFor(row.explorer_level)}</small></div>
          <small>{row.xp} XP</small>
        </div>
      ))}
      {!meInTop && me && (
        <div className="elbiyahe-leaderboard-row me">
          <b>#{me.rank}</b>
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{(me.display_name ?? "?").charAt(0).toUpperCase()}</span>
          <div><b>You</b><small className="muted">{tierFor(me.explorer_level)}</small></div>
          <small>{me.xp} XP</small>
        </div>
      )}
    </div>
  );
}

export function Passport({ Header, BottomNav, Footer, Button }: Shell) {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading, error } = usePassport();
  const missionsQuery = usePassportMissions();
  const leaderboard = useLeaderboard();
  const claimMission = useClaimMission();
  const scan = useScanPassport();
  const [code, setCode] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [last, setLast] = useState<{ name: string; category: string; total: number } | null>(null);
  const loc = useUserLocation();

  useEffect(() => {
    if (!scanOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setScanOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [scanOpen]);

  const total = data && data.locations.length ? data.locations.length : 0;
  const collected = data ? data.scannedLocationIds.length : 0;

  const submitCode = async () => {
    if (!user) { navigate("/login?next=/passport"); return; }
    const pos = await getPosition();
    scan.mutate(
      { code, lat: pos?.lat, lng: pos?.lng },
      {
        onSuccess: r => {
          if (r.ok) {
            setLast({ name: r.name!, category: r.category!, total: r.stamps_collected ?? collected + 1 });
            setCode(""); setScanOpen(false);
            notify(`New stamp collected — ${r.name}!`);
          } else {
            notify(r.message ?? "Could not collect that stamp.");
          }
        },
        onError: err => notify(err.message),
      },
    );
  };

  const onClaimMission = (missionId: string) => {
    claimMission.mutate(missionId, {
      onSuccess: r => notify(r.ok ? `Mission complete — +${r.xp_awarded} XP!` : (r.message ?? "Not ready to claim yet.")),
      onError: err => notify(err.message),
    });
  };

  const nearbyUnscanned = useMemo(() => {
    let list = (data?.locations ?? []).filter(l => !l.is_mystery && !data?.scannedLocationIds.includes(l.id));
    if (loc.coords) {
      list = [...list].sort((a, b) => {
        const da = a.lat != null ? distanceKm(loc.coords!, { lat: a.lat, lng: a.lng! }) : Infinity;
        const db = b.lat != null ? distanceKm(loc.coords!, { lat: b.lat, lng: b.lng! }) : Infinity;
        return da - db;
      });
    }
    return list.slice(0, 4);
  }, [data, loc.coords]);

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <section className="elbiyahe-transpo-hero elbiyahe-passport-hero">
          <div>
            <p className="eyebrow">EXPLORE. COLLECT. EARN.</p>
            <h1>Your Los Baños Passport</h1>
            <p className="muted">Explore Los Baños, collect stamps, and earn real rewards from local partners.</p>
            <button className="elbiyahe-scan-btn" onClick={() => (user ? setScanOpen(true) : navigate("/login?next=/passport"))}>
              <QrCode size={20} /> Scan Passport
            </button>
          </div>
          <div className="elbiyahe-transpo-hero-media">
            <img src="/scenes/elbiyahe-hero.svg" alt="" />
            <WaxSealMark />
          </div>
        </section>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {last && (
          <div className="elbiyahe-stamp-success">
            <Sparkles size={22} />
            <div>
              <b>New Stamp Collected!</b>
              <span>{last.name.toUpperCase()} — {last.category.toUpperCase()}</span>
              <small>{last.total}/{total} · +1 {last.category} discovery</small>
            </div>
          </div>
        )}

        {!user && (
          <div className="empty-state"><QrCode size={26} /><h3>Sign in to start collecting stamps.</h3><Button onClick={() => navigate("/login?next=/passport")}>Sign In</Button></div>
        )}

        {user && data && (
          <div className="elbiyahe-passport-dashboard">
            <div className="main">
              <PassportCard displayName={profile?.display_name ?? null} xp={data.xp} explorerLevel={data.explorerLevel} joinedAt={data.joinedAt} />
              <PassportStats stampsCollected={collected} xp={data.xp} eventsJoinedCount={data.eventsJoinedCount} />
              <ShareJourneyCallout />

              {nearbyUnscanned.length > 0 && (
                <section className="elbiyahe-nearby-stamps">
                  <div className="elbiyahe-nearby-head">
                    <h2>Nearby unscanned spots</h2>
                    {loc.status !== "granted" && (
                      <button className="link-accent" onClick={() => loc.request()}>
                        <Navigation size={14} /> {loc.status === "prompting" ? "Locating…" : "Sort by distance"}
                      </button>
                    )}
                  </div>
                  <ul>
                    {nearbyUnscanned.map(l => {
                      const km = loc.coords && l.lat != null ? distanceKm(loc.coords, { lat: l.lat, lng: l.lng! }) : null;
                      const inner = (
                        <>
                          <span className={`dot ${DOT_CLASS[l.category] ?? "gem"}`} />
                          <div><b>{l.name}</b><small className="muted">{l.category}{km != null ? ` · ${formatDistance(km)}` : ""}</small></div>
                          <ChevronRight size={16} />
                        </>
                      );
                      return l.lat != null && l.lng != null
                        ? <li key={l.id}><a href={directionsUrl(l.lat, l.lng)} target="_blank" rel="noreferrer" className="elbiyahe-nearby-row">{inner}</a></li>
                        : <li key={l.id}>{inner}</li>;
                    })}
                  </ul>
                </section>
              )}

              <MyStampsGrid locations={data.locations} scannedLocationIds={data.scannedLocationIds} />

              {!missionsQuery.isLoading && (
                <PassportMissionsList
                  missions={missionsQuery.data?.missions ?? []}
                  progressByMissionId={missionsQuery.data?.progressByMissionId ?? {}}
                  completedMissionIds={missionsQuery.data?.completedMissionIds ?? []}
                  onClaim={onClaimMission}
                  claiming={claimMission.isPending}
                />
              )}

              <EncouragementBanner displayName={profile?.display_name ?? null} xp={data.xp} />
            </div>

            <aside className="side">
              <RedeemRewardsPanel rewards={data.rewards} stampsCollected={collected} />
              {!leaderboard.isLoading && leaderboard.data && (
                <LeaderboardPanel top={leaderboard.data.top} me={leaderboard.data.me} meInTop={leaderboard.data.meInTop} />
              )}
              <div className="elbiyahe-newsletter-card">
                <Sparkles size={22} />
                <h4>Keep exploring LB!</h4>
                <p>More destinations, delicacies, and events are waiting to be discovered.</p>
                <Link href="/explore" className="btn outline">Explore Los Baños</Link>
              </div>
            </aside>
          </div>
        )}

        {user && data && (
          <div className="elbiyahe-community-cta" style={{ flexDirection: "column", alignItems: "stretch", gap: 18 }}>
            <div><h3>Why El-Biyahe! Passport?</h3></div>
            <div className="elbiyahe-value-props">
              <div><span className="step-icon"><MapPin size={20} /></span><div><b>Real Stamps, Real Rewards</b><p className="muted">Every spot is a real Los Baños location</p></div></div>
              <div><span className="step-icon"><Trophy size={20} /></span><div><b>Track Your Level</b><p className="muted">Explorer → Local Insider → Completionist</p></div></div>
              <div><span className="step-icon"><Users size={20} /></span><div><b>Support Local</b><p className="muted">Rewards from real local partners</p></div></div>
              <div><span className="step-icon"><Star size={20} /></span><div><b>Compete &amp; Compare</b><p className="muted">See how you rank on the leaderboard</p></div></div>
            </div>
          </div>
        )}
      </main>

      {scanOpen && (
        <div className="modal-backdrop" onClick={() => setScanOpen(false)} role="dialog" aria-modal="true" aria-label="Scan Passport">
          <div className="modal" onClick={ev => ev.stopPropagation()}>
            <div className="modal-head"><h2>Scan Passport</h2><button onClick={() => setScanOpen(false)} aria-label="Close">✕</button></div>
            <div className="elbiyahe-scan-frame"><QrCode size={54} /><p>Point your camera at an El-Biyahe! Passport QR around Los Baños.</p></div>
            <label className="modal-field">
              Enter code manually
              <input
                value={code}
                onChange={ev => setCode(ev.target.value)}
                placeholder="e.g. ELBIYAHE-MAKILING"
                onKeyDown={ev => ev.key === "Enter" && submitCode()}
                autoFocus
              />
            </label>
            <Button onClick={submitCode} disabled={scan.isPending}>Collect stamp</Button>
            <p className="muted" style={{ fontSize: 12 }}>Demo codes: ELBIYAHE-MAKILING · ELBIYAHE-MUSEUM · ELBIYAHE-BUKOPIE · ELBIYAHE-IRRI</p>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </>
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
        <img src={r.image || "/scenes/elbiyahe-bus.svg"} alt="" />
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
  const { data, isLoading, error } = useRideGuide();
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
            <img src="/scenes/elbiyahe-bus.svg" alt="" />
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
        {error && <LoadError message={(error as Error).message} />}

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

              <div className="elbiyahe-newsletter-card">
                <QrCode size={22} />
                <h4>Collect. Eat. Earn!</h4>
                <p>Explore spots and earn rewards with your LB Passport.</p>
                <Link href="/passport" className="btn outline">Learn More <ArrowRight size={13} /></Link>
              </div>
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

/* ======================= HERITAGE WALK ======================= */

export function HeritageWalk({ Header, BottomNav, Footer }: Shell) {
  const { data: stops, isLoading, error } = useHeritageWalk();
  const eras = useMemo(() => {
    const groups: { era: string; list: HeritageWalkStop[] }[] = [];
    for (const s of stops ?? []) {
      let g = groups.find(x => x.era === s.era_group);
      if (!g) { g = { era: s.era_group, list: [] }; groups.push(g); }
      g.list.push(s);
    }
    return groups;
  }, [stops]);
  const points = (stops ?? [])
    .filter(s => s.lat != null && s.lng != null)
    .map(s => ({ id: s.id, lat: s.lat!, lng: s.lng!, name: `${s.sort}. ${s.name}`, kind: "Culture", sub: s.era_group }));

  return (
    <>
      <Header />
      <main className="container elbiyahe-page elbiyahe-heritage">
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">SELF-GUIDED · ~2.5 KM ON FOOT</p>
            <h1>Los Baños Heritage Walk</h1>
            <p className="muted">
              For over 400 years, Los Baños has been a sanctuary for rest and rejuvenation. This
              17-stop walk traces the places that shaped the town — from the 1613 Immaculate
              Conception Parish and the ruins of Agua Santa Resort to the old train station,
              Baker Hall, and the hot springs that gave "The Baths" its name. Start anywhere along
              the route; most stops sit within the poblacion, with a few on the UPLB campus.
            </p>
          </div>
        </div>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {stops && stops.length > 0 && (
          <>
            <MapView
              points={points}
              routeLine
              numbered
              fitBounds
              height={420}
              ariaLabel="Map of the 17-stop Los Baños Heritage Walk"
            />

            {eras.map(({ era, list }) => (
              <section key={era} className="elbiyahe-heritage-era">
                <h2>{era}</h2>
                <ol className="elbiyahe-heritage-list">
                  {list.map(s => (
                    <li key={s.id}>
                      <span className="elbiyahe-heritage-num">{s.sort}</span>
                      <div>
                        <b>{s.name}</b>
                        {s.is_passport_spot && <span className="tag ochre">Passport stamp</span>}
                        <p className="muted">{s.blurb}</p>
                        {s.lat != null && s.lng != null && (
                          <a href={directionsUrl(s.lat, s.lng)} target="_blank" rel="noreferrer" className="link-accent">
                            <Navigation size={13} /> Directions
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            <section className="elbiyahe-location-section">
              <h2>Make it a trip</h2>
              <div className="elbiyahe-cv-grid">
                <Link href="/passport" className="elbiyahe-cv-item"><QrCode size={18} /> Collect Passport stamps</Link>
                <Link href="/ride-guide" className="elbiyahe-cv-item"><Navigation size={18} /> How to get around</Link>
                <Link href="/delicacies" className="elbiyahe-cv-item"><Utensils size={18} /> Eat along the way</Link>
                <Link href="/explore" className="elbiyahe-cv-item"><Compass size={18} /> More of Los Baños</Link>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </>
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
        <img src={d.hero_image || "/scenes/elbiyahe-food.svg"} alt={d.name} />
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
  const { data, isLoading, error } = useDelicacies();
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
          <div className="elbiyahe-delicacies-hero-media"><img src="/scenes/elbiyahe-food.svg" alt="" /></div>
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
            {error && <LoadError message={(error as Error).message} />}

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
                    <img src={d.hero_image || "/scenes/elbiyahe-food.svg"} alt="" />
                    <div>
                      <b>{d.name}</b>
                      <small>{d.category}{km != null ? ` · ${formatDistance(km)}` : ""}</small>
                      <Rating value={d.rating} count={d.review_count} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="elbiyahe-newsletter-card">
              <QrCode size={22} />
              <h4>Collect. Eat. Earn!</h4>
              <p>Scan spots, collect stamps, and earn rewards with your LB Passport.</p>
              <Link href="/passport" className="btn outline">Open Passport</Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <BottomNav />
      {showSuggest && <SuggestionModal onClose={() => setShowSuggest(false)} />}
    </>
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
  const { data, isLoading, error } = useParkingSpots();
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
            <img src="/scenes/elbiyahe-bus.svg" alt="" />
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
        {error && <LoadError message={(error as Error).message} />}

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

