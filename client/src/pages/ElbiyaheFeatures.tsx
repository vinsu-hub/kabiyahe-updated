/* El-Biyahe! priority feature tabs — Events, Bus Tours, Passport, Ride Guide, and a
   shared Coming Soon placeholder. Data comes from Supabase via
   @/lib/supabase/queries. Shared shell (Header/BottomNav/Footer/Button/Tag) is
   passed in from App.tsx. */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, BadgeCheck, Bookmark, Bus, CalendarDays, Car, Check, ChevronRight,
  Clock3, Compass, ExternalLink, Footprints, Heart, List, Loader2, MapPin, Navigation, QrCode, Search,
  Share2, Sparkles, Star, Ticket, Users, Utensils,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import {
  useAccommodations, useDelicacies, useEvent, useEvents, useMyRsvp, useParkingSpots, usePassport,
  useReserveAccommodation, useReserveTour, useRideGuide, useScanPassport, useSeasons, useToggleRsvp, useTour, useTours,
  useHeritageWalk,
} from "@/lib/supabase/queries";
import type { AccommodationRow, DelicacyRow, EventRow, HeritageWalkStop, ParkingSpotRow, StampCategory } from "@/lib/supabase/types";
import { MapView, type LBPoint, type ZoneCircle } from "@/components/MapView";
import { LB_CENTER, directionsUrl, distanceKm, formatDistance, getPosition, useUserLocation } from "@/lib/geo";

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

function Loading() {
  return (
    <div className="elbiyahe-loading" role="status">
      <Loader2 size={22} className="elbiyahe-spin" /> Loading…
    </div>
  );
}
function LoadError({ message }: { message?: string }) {
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

function EventCard({ e, Tag }: { e: EventRow; Tag: Shell["Tag"] }) {
  return (
    <Link href={`/events/${e.slug}`} className="elbiyahe-event-card">
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
        {e.status !== "anytime" && <p className="muted"><Users size={13} /> {e.attendee_count.toLocaleString()} going</p>}
      </div>
    </Link>
  );
}

export function EventsList({ Header, BottomNav, Footer, Tag }: Shell) {
  const { data: events, isLoading, error } = useEvents();
  const { data: seasons } = useSeasons();
  const [category, setCategory] = useState<(typeof EVENT_CATEGORIES)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");
  const [season, setSeason] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"soonest" | "popular">("soonest");
  const isSearching = query.trim() !== "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (events ?? []).filter(e =>
      (category === "All" || e.category === category) &&
      (season === "all" || e.season_key === season) &&
      (!q || `${e.title} ${e.venue_name ?? ""} ${e.description ?? ""}`.toLowerCase().includes(q)));
    return [...list].sort((a, b) => sort === "popular"
      ? b.attendee_count - a.attendee_count
      : (a.starts_at ? new Date(a.starts_at).getTime() : Infinity) - (b.starts_at ? new Date(b.starts_at).getTime() : Infinity));
  }, [events, category, season, query, sort]);

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">WHAT'S HAPPENING IN LB</p>
            <h1>Events</h1>
            <p className="muted">Discover and attend what's on across Los Baños — by season, date, and barangay.</p>
          </div>
          <div className="elbiyahe-view-toggle">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={15} /> List</button>
            <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}><MapPin size={15} /> Map</button>
          </div>
        </div>

        <div className="elbiyahe-filter-bar">
          <div className="filter-pills">
            {EVENT_CATEGORIES.map(c => (
              <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="searchbox elbiyahe-searchbox">
            <Search size={15} />
            <input aria-label="Search events" placeholder="Search events, venues…" value={query} onChange={ev => setQuery(ev.target.value)} />
          </div>
          <label className="elbiyahe-select">
            Season
            <select value={season} onChange={ev => setSeason(ev.target.value)}>
              <option value="all">All seasons</option>
              {(seasons ?? []).map(s => <option key={s.key} value={s.key}>{s.quarter} · {s.name.replace(/^El-Biyahe!\s*/, "")}</option>)}
            </select>
          </label>
          <label className="elbiyahe-select">
            Sort by
            <select value={sort} onChange={ev => setSort(ev.target.value as typeof sort)}>
              <option value="soonest">Soonest</option>
              <option value="popular">Most popular</option>
            </select>
          </label>
        </div>

        <p className="elbiyahe-results-count muted">{filtered.length} event{filtered.length === 1 ? "" : "s"} found</p>

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
              {filtered.map(e => <EventCard key={e.id} e={e} Tag={Tag} />)}
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
                  {items.map(e => <EventCard key={e.id} e={e} Tag={Tag} />)}
                </div>
              </section>
            );
          })
        ))}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <CalendarDays size={26} />
            <h3>No events match those filters.</h3>
            <p>Try a different category or season.</p>
          </div>
        )}
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

const TOUR_FILTERS = ["All", "Nature", "Culture", "Food", "Science"] as const;

export function BusTours({ Header, BottomNav, Footer }: Shell) {
  const { data: tours, isLoading, error } = useTours();
  const [filter, setFilter] = useState<(typeof TOUR_FILTERS)[number]>("All");
  const list = (tours ?? []).filter(t => filter === "All" || t.tags.includes(filter));

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">SEE MORE, STRESS LESS</p>
            <h1>Bus Tours</h1>
            <p className="muted">Curated itineraries with transport, stops, and a guide — for visitors coming from other cities.</p>
          </div>
        </div>

        <div className="filter-pills">
          {TOUR_FILTERS.map(f => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        <div className="elbiyahe-tour-grid">
          {list.map(t => (
            <Link key={t.id} href={`/tours/${t.slug}`} className="elbiyahe-tour-card">
              <div className="elbiyahe-tour-card-media">
                <img src={t.hero_image || "/scenes/elbiyahe-bus.svg"} alt={t.title} />
                {t.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}
              </div>
              <div className="elbiyahe-tour-card-body">
                <div className="elbiyahe-chip-row">{t.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
                <h3>{t.title}</h3>
                <p className="muted"><Clock3 size={13} /> {t.duration}&nbsp;&nbsp;·&nbsp;&nbsp;<Bus size={13} />&nbsp;{t.operator_name}</p>
                <div className="elbiyahe-tour-card-foot">
                  <b>{peso(t.price_per_seat)}<small> /seat</small></b>
                  <span className="rating"><Star size={13} fill="currentColor" /> {Number(t.rating).toFixed(1)} <small>({t.review_count})</small></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!isLoading && !error && list.length === 0 && (
          <div className="empty-state"><Bus size={26} /><h3>No packages in that category yet.</h3><p>Try another filter.</p></div>
        )}
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
          <div><b>{Number(t.rating).toFixed(1)} ★</b><small>{t.review_count} reviews</small></div>
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

export function Passport({ Header, BottomNav, Footer, Button }: Shell) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading, error } = usePassport();
  const { data: seasons } = useSeasons();
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

  const currentSeason = seasons?.find(s => s.is_current);
  const total = data && data.locations.length ? data.locations.length : 0;
  const collected = data ? data.scannedLocationIds.length : 0;
  const pct = total ? Math.round((collected / total) * 100) : 0;

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = { Nature: 0, Culture: 0, Food: 0, Science: 0, Event: 0, Community: 0 };
    if (data) {
      const scanned = new Set(data.scannedLocationIds);
      for (const loc of data.locations) if (scanned.has(loc.id)) counts[loc.category] = (counts[loc.category] ?? 0) + 1;
    }
    return counts;
  }, [data]);

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

  return (
    <>
      <Header />
      <main className="container elbiyahe-page elbiyahe-passport">
        <div className="elbiyahe-passport-header">
          <img src="/scenes/elbiyahe-passport.svg" alt="" />
          <div>
            <span className="elbiyahe-badge ochre">EXPLORER · LEVEL {data?.explorerLevel ?? 1}</span>
            <h1>Digital LB Passport</h1>
            <p className="muted">{user ? `${collected} / ${total} stamps collected` : "Sign in to start collecting stamps"}</p>
            <div className="progress"><span style={{ width: `${pct}%` }} /></div>
          </div>
        </div>

        <button className="elbiyahe-scan-btn" onClick={() => (user ? setScanOpen(true) : navigate("/login?next=/passport"))}>
          <QrCode size={20} /> Scan Passport
        </button>

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

        <section className="elbiyahe-stamp-cats">
          <h2>Stamps by category</h2>
          <div className="elbiyahe-stamp-cat-grid">
            {(Object.keys(byCategory) as StampCategory[]).map(c => (
              <div key={c} className={`elbiyahe-stamp-cat ${STAMP_TONE[c]}`}>
                <b>{byCategory[c]}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="elbiyahe-nearby-stamps">
          <div className="elbiyahe-nearby-head">
            <h2>Nearby stamps</h2>
            {loc.status !== "granted" && (
              <button className="link-accent" onClick={() => loc.request()}>
                <Navigation size={14} /> {loc.status === "prompting" ? "Locating…" : "Sort by distance"}
              </button>
            )}
          </div>
          <ul>
            {(() => {
              let list = (data?.locations ?? []).filter(l => !data?.scannedLocationIds.includes(l.id));
              if (loc.coords) {
                list = [...list].sort((a, b) => {
                  const da = a.lat != null ? distanceKm(loc.coords!, { lat: a.lat, lng: a.lng! }) : Infinity;
                  const db = b.lat != null ? distanceKm(loc.coords!, { lat: b.lat, lng: b.lng! }) : Infinity;
                  return da - db;
                });
              }
              return list.slice(0, 6).map(l => {
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
              });
            })()}
            {data && data.locations.length > 0 && data.locations.every(l => data.scannedLocationIds.includes(l.id)) && (
              <li><div><b>All nearby stamps collected — nice.</b></div></li>
            )}
          </ul>
        </section>

        {currentSeason && (
          <section className="elbiyahe-season-track">
            <div className="elbiyahe-season-track-head">
              <div>
                <span className="eyebrow">{currentSeason.quarter} · {currentSeason.name.toUpperCase()}</span>
                <h2>Season Track</h2>
              </div>
              <b>{Math.min(collected, 6)}/6</b>
            </div>
            <p className="muted">{currentSeason.pillars}</p>
            <div className="elbiyahe-rewards">
              {(data?.rewards ?? []).map(r => {
                const unlocked = collected >= r.required_stamps;
                return (
                  <div key={r.id} className={`elbiyahe-reward ${unlocked ? "" : "locked"}`}>
                    <Ticket size={16} />
                    <div><b>{r.title}</b><small>{unlocked ? r.description : `Collect ${r.required_stamps - collected} more stamp(s) to unlock`}</small></div>
                    <span className="elbiyahe-reward-state">{unlocked ? "Ready" : "Locked"}</span>
                  </div>
                );
              })}
            </div>
          </section>
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

export function RideGuide({ Header, BottomNav, Footer, Button }: Shell) {
  const { data, isLoading, error } = useRideGuide();
  const [from, setFrom] = useState("UPLB Freedom Park");
  const [to, setTo] = useState("Los Baños Town Proper");
  const [result, setResult] = useState<string | null>(null);

  const findRoute = () => {
    setResult(
      `Take a ${from.includes("UPLB") ? "Town Proper–bound" : "UPLB–bound"} jeepney along the National Highway ` +
      `(₱13 est., ~15 min). For the last stretch to ${to}, a tricycle special is ₱30–₱40. ` +
      `Total: about ₱45 and 25 minutes.`,
    );
    notify("Route found.");
  };

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">GET AROUND LIKE A LOCAL</p>
            <h1>Ride Guide</h1>
            <p className="muted">Real jeepney routes, tricycle zones, and the local etiquette that makes them easy.</p>
          </div>
        </div>

        <div className="elbiyahe-ride-choices">
          <div><Bus size={22} /><b>Jeepney</b><small>Fixed routes along main roads, flat-ish fares</small></div>
          <div><Car size={22} /><b>Tricycle</b><small>Door-to-door within town zones</small></div>
          <div><Navigation size={22} /><b>Walking</b><small>UPLB campus and Poblacion are walkable</small></div>
        </div>

        <section className="elbiyahe-route-planner">
          <h2>Plan your route</h2>
          <div className="elbiyahe-route-inputs">
            <label>From<input value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label>To<input value={to} onChange={e => setTo(e.target.value)} /></label>
            <Button onClick={findRoute}><Navigation size={15} /> Find Route</Button>
          </div>
          {result && <div className="elbiyahe-route-result"><Sparkles size={16} /> <p>{result}</p></div>}
        </section>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {data && (
          <>
            <section className="elbiyahe-routes">
              <h2>Popular jeepney routes</h2>
              <div className="elbiyahe-route-list">
                {data.jeep.map(r => (
                  <div key={r.id} className="elbiyahe-route-row">
                    <div className="elbiyahe-route-row-head"><b>{r.label}</b>{r.mode && <span className="tag">{r.mode}</span>}</div>
                    <p className="muted">{[r.fare_text, r.frequency_text].filter(Boolean).join(" · ")}</p>
                    <p>{r.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="elbiyahe-routes">
              <h2>Tricycle zones</h2>
              <MapView
                center={LB_CENTER}
                zoom={13}
                interactive
                height={320}
                ariaLabel="Los Baños tricycle zones map"
                zones={data.zones.slice(0, 3).map((z, i) => (
                  [
                    { center: { lat: 14.166, lng: 121.238 }, radiusKm: 1.1, label: `Z1 · ${z.fare_text}`, color: "#0e543c" },
                    { center: { lat: 14.177, lng: 121.217 }, radiusKm: 1.0, label: `Z2 · ${z.fare_text}`, color: "#6d2740" },
                    { center: { lat: 14.190, lng: 121.243 }, radiusKm: 1.3, label: `Z3 · ${z.fare_text}`, color: "#d17b27" },
                  ] as ZoneCircle[]
                )[i])}
              />
              <div className="elbiyahe-route-list">
                {data.zones.map(z => (
                  <div key={z.id} className="elbiyahe-route-row">
                    <div className="elbiyahe-route-row-head"><b>{z.label}</b></div>
                    <p className="muted">{z.fare_text}</p>
                    <p>{z.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="elbiyahe-tips">
              <h2>Local travel tips</h2>
              <ul>{data.tips.map(t => <li key={t.id}>{t.body}</li>)}</ul>
            </section>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
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

const DELICACY_CATEGORIES = ["All", "Local Favorites", "Street Food", "Baked Goods", "Dairy & Desserts", "Market Finds"] as const;

function DelicacyCard({ d }: { d: DelicacyRow }) {
  return (
    <article className="elbiyahe-tour-card">
      <div className="elbiyahe-tour-card-media">
        <img src={d.hero_image || "/scenes/elbiyahe-food.svg"} alt={d.name} />
        {d.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}
      </div>
      <div className="elbiyahe-tour-card-body">
        <div className="elbiyahe-chip-row">{d.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
        <h3>{d.name}</h3>
        <p className="muted" style={{ alignItems: "flex-start" }}><MapPin size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{d.place}{d.barangay ? `, Brgy. ${d.barangay}` : ""}</span></p>
        <p className="muted" style={{ fontSize: 12 }}>{d.description}</p>
        <div className="elbiyahe-tour-card-foot">
          <b>{"₱".repeat(d.price_tier)}</b>
          {d.rating ? <span className="rating"><Star size={13} fill="currentColor" /> {Number(d.rating).toFixed(1)} <small>({d.review_count})</small></span> : <span className="unrated">Reviews coming soon</span>}
        </div>
      </div>
    </article>
  );
}

export function Delicacies({ Header, BottomNav, Footer }: Shell) {
  const { data, isLoading, error } = useDelicacies();
  const [category, setCategory] = useState<(typeof DELICACY_CATEGORIES)[number]>("All");
  const list = (data ?? []).filter(d => category === "All" || d.category === category);

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">TASTE WHAT'S LOCAL</p>
            <h1>Delicacies</h1>
            <p className="muted">Real Los Baños flavors worth the detour — from the buko pie stretch to the public market stalls.</p>
          </div>
        </div>

        <div className="filter-pills">
          {DELICACY_CATEGORIES.map(c => (
            <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        <div className="elbiyahe-tour-grid">
          {list.map(d => <DelicacyCard d={d} key={d.id} />)}
        </div>
        {!isLoading && !error && list.length === 0 && (
          <div className="empty-state"><Utensils size={26} /><h3>No delicacies in that category yet.</h3><p>Try another filter.</p></div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

/* ============================ STAY & EAT ============================ */

const STAY_EAT_TABS = ["All", "Eat", "Stay"] as const;

function AccommodationCard({ a, onReserve }: { a: AccommodationRow; onReserve: (a: AccommodationRow) => void }) {
  return (
    <article className="elbiyahe-tour-card">
      <div className="elbiyahe-tour-card-media">
        <img src={a.hero_image || "/scenes/elbiyahe-hero.svg"} alt={a.name} />
        {a.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}
      </div>
      <div className="elbiyahe-tour-card-body">
        <div className="elbiyahe-chip-row"><span className="tag">{a.category}</span>{a.amenities.slice(0, 2).map(x => <span key={x} className="tag">{x}</span>)}</div>
        <h3>{a.name}</h3>
        <p className="muted" style={{ alignItems: "flex-start" }}><MapPin size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{a.place}{a.barangay ? `, Brgy. ${a.barangay}` : ""}</span></p>
        <p className="muted" style={{ fontSize: 12 }}>{a.description}</p>
        <div className="elbiyahe-tour-card-foot">
          <b>{a.price_range || "Contact for rates"}</b>
          {a.rating ? <span className="rating"><Star size={13} fill="currentColor" /> {Number(a.rating).toFixed(1)}</span> : <span className="unrated">Reviews coming soon</span>}
        </div>
        <button className="btn secondary sm" style={{ marginTop: 10, width: "100%" }} onClick={() => onReserve(a)}>
          <ExternalLink size={13} /> Book / Reserve
        </button>
      </div>
    </article>
  );
}

export function StayEat({ Header, BottomNav, Footer }: Shell) {
  const { data: delicacies } = useDelicacies();
  const { data: stays, isLoading, error } = useAccommodations();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const reserve = useReserveAccommodation();
  const [tab, setTab] = useState<(typeof STAY_EAT_TABS)[number]>("All");

  const eatPlaces = delicacies ?? [];
  const stayPlaces = stays ?? [];

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
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">DINE. STAY. EXPLORE.</p>
            <h1>Stay &amp; Eat</h1>
            <p className="muted">Where to eat and where to stay around Los Baños — book or reserve directly with the venue.</p>
          </div>
        </div>

        <div className="filter-pills">
          {STAY_EAT_TABS.map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {(tab === "All" || tab === "Eat") && eatPlaces.length > 0 && (
          <section className="elbiyahe-event-group">
            <h2>Eat</h2>
            <div className="elbiyahe-tour-grid">
              {eatPlaces.map(d => <DelicacyCard d={d} key={d.id} />)}
            </div>
          </section>
        )}

        {(tab === "All" || tab === "Stay") && (
          <section className="elbiyahe-event-group">
            <h2>Stay</h2>
            <div className="elbiyahe-tour-grid">
              {stayPlaces.map(a => <AccommodationCard a={a} onReserve={onReserve} key={a.id} />)}
            </div>
            {!isLoading && !error && stayPlaces.length === 0 && (
              <div className="empty-state"><Bookmark size={26} /><h3>No stays listed yet.</h3></div>
            )}
          </section>
        )}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

/* ============================ PARKING ============================ */

const PARKING_FILTERS = ["All", "free", "paid"] as const;

function ParkingCard({ p }: { p: ParkingSpotRow }) {
  return (
    <div className="elbiyahe-route-row">
      <div className="elbiyahe-route-row-head">
        <b>{p.name}</b>
        <span className={`tag ${p.kind === "free" ? "" : "ochre"}`}>{p.kind === "free" ? "Free" : "Paid"}</span>
      </div>
      <p className="muted"><MapPin size={13} /> {p.place}{p.barangay ? `, Brgy. ${p.barangay}` : ""}</p>
      <p className="muted">{[p.fee_label, p.capacity_estimate, p.hours_label].filter(Boolean).join(" · ")}</p>
      {p.notes && <p>{p.notes}</p>}
      {p.lat != null && p.lng != null && (
        <a href={directionsUrl(p.lat, p.lng)} target="_blank" rel="noreferrer" className="link-accent"><Navigation size={13} /> Directions</a>
      )}
    </div>
  );
}

export function Parking({ Header, BottomNav, Footer }: Shell) {
  const { data, isLoading, error } = useParkingSpots();
  const [filter, setFilter] = useState<(typeof PARKING_FILTERS)[number]>("All");
  const list = (data ?? []).filter(p => filter === "All" || p.kind === filter);
  const mapPoints: LBPoint[] = (data ?? []).filter(p => p.lat != null && p.lng != null).map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, name: p.name, kind: "Parking", sub: p.kind === "free" ? "Free" : "Paid" }));

  return (
    <>
      <Header />
      <main className="container elbiyahe-page">
        <div className="elbiyahe-page-head">
          <div>
            <p className="eyebrow">GET AROUND LIKE A LOCAL</p>
            <h1>Parking</h1>
            <p className="muted">Free and paid parking spots around Los Baños, near the places you're actually headed.</p>
          </div>
        </div>

        <div className="filter-pills">
          {PARKING_FILTERS.map(f => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f === "All" ? "All" : f === "free" ? "Free" : "Paid"}</button>
          ))}
        </div>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {mapPoints.length > 0 && <MapView points={mapPoints} fitBounds interactive height={300} ariaLabel="Map of Los Baños parking areas" />}

        <div className="elbiyahe-route-list">
          {list.map(p => <ParkingCard p={p} key={p.id} />)}
        </div>
        {!isLoading && !error && list.length === 0 && (
          <div className="empty-state"><Car size={26} /><h3>No parking spots listed yet.</h3></div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

