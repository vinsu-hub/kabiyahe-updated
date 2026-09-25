import "@/styles/pages/events.css";
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


export function LoadError({ message }: { message?: string }) {
  return (
    <div className="empty-state">
      <QrCode size={24} />
      <h3>Couldn't load this yet.</h3>
      <p>{message || "Check your connection and try again."}</p>
    </div>
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
