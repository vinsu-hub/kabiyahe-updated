/* ELBI priority feature tabs — Events, Bus Tours, Passport, Ride Guide, and a
   shared Coming Soon placeholder. Data comes from Supabase via
   @/lib/supabase/queries. Shared shell (Header/BottomNav/Footer/Button/Tag) is
   passed in from App.tsx. */
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, BadgeCheck, Bookmark, Bus, CalendarDays, Check, ChevronRight,
  Clock3, Compass, ExternalLink, Heart, List, Loader2, MapPin, Navigation, QrCode,
  Share2, Sparkles, Star, Ticket, Users, Utensils,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import {
  useEvent, useEvents, useMyRsvp, usePassport, useReserveTour, useRideGuide,
  useScanPassport, useSeasons, useToggleRsvp, useTour, useTours,
} from "@/lib/supabase/queries";
import type { EventRow, StampCategory } from "@/lib/supabase/types";

interface Shell {
  Header: React.ComponentType;
  BottomNav: React.ComponentType;
  Footer: React.ComponentType;
  Button: React.ComponentType<any>;
  Tag: React.ComponentType<any>;
}

const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent("kabiyahe:notice", { detail: message }));
const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

function useSeasonName() {
  const { data } = useSeasons();
  return (key: string | null | undefined) =>
    (key && data?.find(s => s.key === key)?.name) || "";
}

function Loading() {
  return (
    <div className="elbi-loading" role="status">
      <Loader2 size={22} className="elbi-spin" /> Loading…
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
  { key: ["live", "today"], label: "Today" },
  { key: ["week"], label: "This Week" },
  { key: ["season"], label: "This Season" },
  { key: ["recap"], label: "Past — Recaps" },
];

function EventCard({ e, Tag }: { e: EventRow; Tag: Shell["Tag"] }) {
  return (
    <Link href={`/events/${e.slug}`} className="elbi-event-card">
      <div className="elbi-event-card-media">
        <img src={e.hero_image || "/scenes/elbi-hero.svg"} alt={e.title} />
        {e.status === "live" && <span className="elbi-badge live">LIVE NOW</span>}
        {e.status === "recap" && <span className="elbi-badge grey">RECAP</span>}
      </div>
      <div className="elbi-event-card-body">
        <div className="elbi-chip-row">
          <Tag>{e.category}</Tag>
          <span className="muted"><CalendarDays size={13} /> {e.date_label} · {e.time_label}</span>
        </div>
        <h3>{e.title}</h3>
        <p className="muted"><MapPin size={13} /> {e.venue_name}</p>
        <p className="muted"><Users size={13} /> {e.attendee_count.toLocaleString()} going</p>
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

  const filtered = useMemo(
    () => (events ?? []).filter(e =>
      (category === "All" || e.category === category) &&
      (season === "all" || e.season_key === season)),
    [events, category, season],
  );

  return (
    <>
      <Header />
      <main className="container elbi-page">
        <div className="elbi-page-head">
          <div>
            <p className="eyebrow">WHAT'S HAPPENING IN LB</p>
            <h1>Events</h1>
            <p className="muted">Discover and attend what's on across Los Baños — by season, date, and barangay.</p>
          </div>
          <div className="elbi-view-toggle">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={15} /> List</button>
            <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}><MapPin size={15} /> Map</button>
          </div>
        </div>

        <div className="elbi-filter-bar">
          <div className="filter-pills">
            {EVENT_CATEGORIES.map(c => (
              <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <label className="elbi-select">
            Season
            <select value={season} onChange={ev => setSeason(ev.target.value)}>
              <option value="all">All seasons</option>
              {(seasons ?? []).map(s => <option key={s.key} value={s.key}>{s.quarter} · {s.name}</option>)}
            </select>
          </label>
        </div>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {!isLoading && !error && (view === "map" ? (
          <div className="elbi-map-field">
            <div className="map-copy">Los Baños<br /><small>Laguna</small></div>
            {filtered.map((e, i) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className={`pin ${e.category === "Culture" ? "culture" : e.category === "Sports" ? "nature" : e.category === "Arts" ? "gem" : "food"}`}
                style={{ left: `${12 + ((i * 19) % 74)}%`, top: `${16 + ((i * 23) % 66)}%` }}
              >⌖</Link>
            ))}
            <div className="map-legend">
              <b>Category</b>
              <span><span className="dot culture" /> Culture</span>
              <span><span className="dot nature" /> Sports</span>
              <span><span className="dot gem" /> Arts</span>
              <span><span className="dot food" /> Community</span>
            </div>
          </div>
        ) : (
          EVENT_GROUPS.map(group => {
            const items = filtered.filter(e => group.key.includes(e.status));
            if (!items.length) return null;
            return (
              <section key={group.label} className="elbi-event-group">
                <h2>{group.label}</h2>
                <div className="elbi-event-grid">
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
  const [tab, setTab] = useState<"About" | "Schedule" | "Organizers" | "Updates">("About");
  const [saved, setSaved] = useState(false);

  if (isLoading) return <><Header /><main className="container elbi-detail"><Loading /></main><Footer /><BottomNav /></>;
  if (error || !e) return <><Header /><main className="container elbi-detail"><LoadError message={(error as Error)?.message} /></main><Footer /><BottomNav /></>;

  const past = e.status === "recap";
  const schedule = [...(e.event_schedule_items ?? [])].sort((a, b) => a.sort - b.sort);
  const updates = e.event_updates ?? [];

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
      <main className="container elbi-detail">
        <Link href="/events" className="back-link"><ArrowLeft size={16} /> Back to Events</Link>

        <section className="elbi-detail-hero">
          <img src={e.hero_image || "/scenes/elbi-hero.svg"} alt={e.title} />
          {e.status === "live" && <span className="elbi-badge live">LIVE NOW</span>}
          {past && <span className="elbi-badge grey">EVENT RECAP</span>}
          <div className="elbi-detail-hero-actions">
            <button aria-label="Save event" className={saved ? "on" : ""} onClick={() => { setSaved(v => !v); notify(saved ? "Removed from saved" : "Saved for later"); }}>
              <Heart size={17} fill={saved ? "currentColor" : "none"} />
            </button>
            <button aria-label="Share event" onClick={() => notify("Event link copied to clipboard.")}><Share2 size={17} /></button>
          </div>
        </section>

        <div className="elbi-chip-row">
          <Tag>{e.category}</Tag>
          {e.season_key && <Tag tone="ochre">{seasonName(e.season_key)}</Tag>}
        </div>
        <h1>{e.title}</h1>
        <div className="elbi-detail-facts">
          <span><CalendarDays size={15} /> {e.date_label} · {e.time_label}</span>
          <span><MapPin size={15} /> {e.venue_name}{e.barangay ? `, Brgy. ${e.barangay}` : ""}</span>
          <span><Users size={15} /> {e.attendee_count.toLocaleString()} going</span>
        </div>

        {!past && (
          <div className="elbi-rsvp-row">
            <button className={`elbi-rsvp ${rsvped ? "done" : ""}`} disabled={toggleRsvp.isPending} onClick={onRsvp}>
              {rsvped ? <><Check size={17} /> You're going</> : "RSVP to this event"}
            </button>
            <button className="elbi-bookmark" aria-label="Bookmark event" onClick={() => notify("Event bookmarked.")}><Bookmark size={17} /></button>
          </div>
        )}

        <div className="elbi-tabs">
          {(["About", "Schedule", "Organizers", "Updates"] as const).map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="elbi-tab-body">
          {tab === "About" && <p>{e.description}</p>}
          {tab === "Schedule" && (
            schedule.length ? (
              <ol className="elbi-schedule">
                {schedule.map(s => (
                  <li key={s.id} className={s.state ?? ""}>
                    <span className="elbi-schedule-time">{s.time_label}</span>
                    <span>{s.item}</span>
                    {s.state === "live" && <span className="elbi-badge live sm">LIVE</span>}
                    {s.state === "done" && <span className="elbi-badge grey sm">DONE</span>}
                  </li>
                ))}
              </ol>
            ) : <p className="muted">Full schedule to be announced.</p>
          )}
          {tab === "Organizers" && <div className="elbi-organizer"><BadgeCheck size={18} /> <span>{e.organizer}</span></div>}
          {tab === "Updates" && (
            updates.length ? updates.map(u => (
              <div key={u.id} className="elbi-update"><b>{u.ago_label}</b><p>{u.body}</p></div>
            )) : <p className="muted">No updates yet. Check back closer to the date.</p>
          )}
        </div>

        <section className="elbi-complete-visit">
          <h2>Complete Your Visit</h2>
          <div className="elbi-cv-grid">
            <Link href="/stay-eat" className="elbi-cv-item"><Utensils size={18} /> Eat Nearby</Link>
            <Link href="/stay-eat" className="elbi-cv-item"><Bookmark size={18} /> Stay Nearby</Link>
            <Link href="/ride-guide" className="elbi-cv-item"><Navigation size={18} /> How to Get Here</Link>
            <Link href="/explore" className="elbi-cv-item"><Compass size={18} /> Explore Nearby</Link>
          </div>
        </section>

        <Link href="/passport" className="elbi-passport-teaser">
          <QrCode size={20} />
          <span><b>Nearby Passport Spots</b><small>Collect stamps around this venue in your Digital LB Passport</small></span>
          <ChevronRight size={18} />
        </Link>
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
      <main className="container elbi-page">
        <div className="elbi-page-head">
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

        <div className="elbi-tour-grid">
          {list.map(t => (
            <Link key={t.id} href={`/tours/${t.slug}`} className="elbi-tour-card">
              <div className="elbi-tour-card-media">
                <img src={t.hero_image || "/scenes/elbi-bus.svg"} alt={t.title} />
                {t.featured && <span className="elbi-badge ochre">FEATURED</span>}
              </div>
              <div className="elbi-tour-card-body">
                <div className="elbi-chip-row">{t.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
                <h3>{t.title}</h3>
                <p className="muted"><Clock3 size={13} /> {t.duration}&nbsp;&nbsp;·&nbsp;&nbsp;<Bus size={13} />&nbsp;{t.operator_name}</p>
                <div className="elbi-tour-card-foot">
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

  if (isLoading) return <><Header /><main className="container elbi-detail"><Loading /></main><Footer /><BottomNav /></>;
  if (error || !t) return <><Header /><main className="container elbi-detail"><LoadError message={(error as Error)?.message} /></main><Footer /><BottomNav /></>;

  const stops = [...(t.tour_itinerary_stops ?? [])].sort((a, b) => a.sort - b.sort);
  const reviews = t.tour_reviews ?? [];
  const soldOutSoon = t.seats_available <= 10;

  const onReserve = () => {
    if (!user) { navigate(`/login?next=/tours/${t.slug}`); return; }
    reserve.mutate(
      { id: t.id, reserve_url: t.reserve_url, title: t.title, operator_name: t.tour_operators?.name },
      {
        onSuccess: () => notify("Opening the tour operator's booking channel — ELBI never processes payment."),
        onError: err => notify(err.message),
      },
    );
  };

  return (
    <>
      <Header />
      <main className="container elbi-detail">
        <Link href="/tours" className="back-link"><ArrowLeft size={16} /> Back to Bus Tours</Link>

        <section className="elbi-detail-hero">
          <img src={t.hero_image || "/scenes/elbi-bus.svg"} alt={t.title} />
          {t.featured && <span className="elbi-badge ochre">FEATURED</span>}
        </section>

        <div className="elbi-chip-row">
          {t.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          {t.season_key && <Tag tone="ochre">{seasonName(t.season_key)} season</Tag>}
        </div>
        <h1>{t.title}</h1>
        <p className="muted"><Bus size={14} /> Operated by {t.tour_operators?.name}</p>
        <p>{t.summary}</p>

        <div className="elbi-tour-meta">
          <div><b>{peso(t.price_per_seat)}</b><small>per seat</small></div>
          <div><b>{t.duration}</b><small>duration</small></div>
          <div><b>{Number(t.rating).toFixed(1)} ★</b><small>{t.review_count} reviews</small></div>
          <div><b className={soldOutSoon ? "warn" : ""}>{t.seats_available}</b><small>of {t.seat_capacity} seats left</small></div>
        </div>

        <div className="elbi-tour-logistics">
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

        <section className="elbi-itinerary">
          <h2>Itinerary</h2>
          <ol>
            {stops.map(s => (
              <li key={s.id}>
                <span className="elbi-itinerary-time">{s.time_label}</span>
                <div><b>{s.name}</b><p className="muted">{s.blurb}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <div className="elbi-reserve-bar">
          <div>
            <b>{peso(t.price_per_seat)} <small>/ seat</small></b>
            <small className="muted">{t.seats_available} seats left · referral booking</small>
          </div>
          <Button onClick={onReserve} disabled={reserve.isPending}><Ticket size={16} /> Reserve Seat</Button>
        </div>
        <p className="elbi-referral-note"><ExternalLink size={13} /> Reserving opens {t.tour_operators?.name}'s own booking channel. ELBI logs the referral but never processes payment.</p>

        <section className="elbi-reviews">
          <h2>Reviews</h2>
          {reviews.map(r => (
            <div key={r.id} className="elbi-review">
              <div className="elbi-review-head"><b>{r.author_name}</b><Stars value={r.rating} /></div>
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

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 6000 },
    );
  });
}

export function Passport({ Header, BottomNav, Footer, Button }: Shell) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading, error } = usePassport();
  const { data: seasons } = useSeasons();
  const scan = useScanPassport();
  const [code, setCode] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [last, setLast] = useState<{ name: string; category: string; total: number } | null>(null);

  const currentSeason = seasons?.find(s => s.is_current);
  const total = 30;
  const collected = data ? data.scannedLocationIds.length : 0;
  const pct = Math.round((collected / total) * 100);

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
      <main className="container elbi-page elbi-passport">
        <div className="elbi-passport-header">
          <img src="/scenes/elbi-passport.svg" alt="" />
          <div>
            <span className="elbi-badge ochre">EXPLORER · LEVEL {data?.explorerLevel ?? 1}</span>
            <h1>Digital LB Passport</h1>
            <p className="muted">{user ? `${collected} / ${total} stamps collected` : "Sign in to start collecting stamps"}</p>
            <div className="progress"><span style={{ width: `${pct}%` }} /></div>
          </div>
        </div>

        <button className="elbi-scan-btn" onClick={() => (user ? setScanOpen(true) : navigate("/login?next=/passport"))}>
          <QrCode size={20} /> Scan Passport
        </button>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {last && (
          <div className="elbi-stamp-success">
            <Sparkles size={22} />
            <div>
              <b>New Stamp Collected!</b>
              <span>{last.name.toUpperCase()} — {last.category.toUpperCase()}</span>
              <small>{last.total}/{total} · +1 {last.category} discovery</small>
            </div>
          </div>
        )}

        <section className="elbi-stamp-cats">
          <h2>Stamps by category</h2>
          <div className="elbi-stamp-cat-grid">
            {(Object.keys(byCategory) as StampCategory[]).map(c => (
              <div key={c} className={`elbi-stamp-cat ${STAMP_TONE[c]}`}>
                <b>{byCategory[c]}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="elbi-nearby-stamps">
          <h2>Nearby stamps</h2>
          <ul>
            {(data?.locations ?? []).filter(l => !data?.scannedLocationIds.includes(l.id)).slice(0, 6).map(l => (
              <li key={l.id}>
                <span className={`dot ${DOT_CLASS[l.category] ?? "gem"}`} />
                <div><b>{l.name}</b><small className="muted">{l.category}</small></div>
                <ChevronRight size={16} />
              </li>
            ))}
            {data && data.locations.length > 0 && data.locations.every(l => data.scannedLocationIds.includes(l.id)) && (
              <li><div><b>All nearby stamps collected — nice.</b></div></li>
            )}
          </ul>
        </section>

        {currentSeason && (
          <section className="elbi-season-track">
            <div className="elbi-season-track-head">
              <div>
                <span className="eyebrow">{currentSeason.quarter} · {currentSeason.name.toUpperCase()}</span>
                <h2>Season Track</h2>
              </div>
              <b>{Math.min(collected, 6)}/6</b>
            </div>
            <p className="muted">{currentSeason.pillars}</p>
            <div className="elbi-rewards">
              {(data?.rewards ?? []).map(r => {
                const unlocked = collected >= r.required_stamps;
                return (
                  <div key={r.id} className={`elbi-reward ${unlocked ? "" : "locked"}`}>
                    <Ticket size={16} />
                    <div><b>{r.title}</b><small>{unlocked ? r.description : `Collect ${r.required_stamps - collected} more stamp(s) to unlock`}</small></div>
                    <span className="elbi-reward-state">{unlocked ? "Ready" : "Locked"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {scanOpen && (
        <div className="modal-backdrop" onClick={() => setScanOpen(false)}>
          <div className="modal" onClick={ev => ev.stopPropagation()}>
            <div className="modal-head"><h2>Scan Passport</h2><button onClick={() => setScanOpen(false)} aria-label="Close">✕</button></div>
            <div className="elbi-scan-frame"><QrCode size={54} /><p>Point your camera at an ELBI Passport QR around Los Baños.</p></div>
            <label className="modal-field">
              Enter code manually
              <input
                value={code}
                onChange={ev => setCode(ev.target.value)}
                placeholder="e.g. ELBI-MAKILING"
                onKeyDown={ev => ev.key === "Enter" && submitCode()}
              />
            </label>
            <Button onClick={submitCode} disabled={scan.isPending}>Collect stamp</Button>
            <p className="muted" style={{ fontSize: 12 }}>Demo codes: ELBI-MAKILING · ELBI-MUSEUM · ELBI-BUKOPIE · ELBI-IRRI</p>
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
      <main className="container elbi-page">
        <div className="elbi-page-head">
          <div>
            <p className="eyebrow">GET AROUND LIKE A LOCAL</p>
            <h1>Ride Guide</h1>
            <p className="muted">Real jeepney routes, tricycle zones, and the local etiquette that makes them easy.</p>
          </div>
        </div>

        <section className="elbi-route-planner">
          <h2>Plan your route</h2>
          <div className="elbi-route-inputs">
            <label>From<input value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label>To<input value={to} onChange={e => setTo(e.target.value)} /></label>
            <Button onClick={findRoute}><Navigation size={15} /> Find Route</Button>
          </div>
          {result && <div className="elbi-route-result"><Sparkles size={16} /> <p>{result}</p></div>}
        </section>

        {isLoading && <Loading />}
        {error && <LoadError message={(error as Error).message} />}

        {data && (
          <>
            <section className="elbi-routes">
              <h2>Popular jeepney routes</h2>
              <div className="elbi-route-list">
                {data.jeep.map(r => (
                  <div key={r.id} className="elbi-route-row">
                    <div className="elbi-route-row-head"><b>{r.label}</b>{r.mode && <span className="tag">{r.mode}</span>}</div>
                    <p className="muted">{[r.fare_text, r.frequency_text].filter(Boolean).join(" · ")}</p>
                    <p>{r.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="elbi-routes">
              <h2>Tricycle zones</h2>
              <div className="elbi-map-field small">
                <div className="map-copy">Los Baños<br /><small>tricycle zones</small></div>
                <span className="pin nature" style={{ left: "24%", top: "40%" }}>1</span>
                <span className="pin culture" style={{ left: "54%", top: "30%" }}>2</span>
                <span className="pin food" style={{ left: "70%", top: "60%" }}>3</span>
              </div>
              <div className="elbi-route-list">
                {data.zones.map(z => (
                  <div key={z.id} className="elbi-route-row">
                    <div className="elbi-route-row-head"><b>{z.label}</b></div>
                    <p className="muted">{z.fare_text}</p>
                    <p>{z.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="elbi-tips">
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

/* ============================ COMING SOON ============================ */

export function ComingSoon({ Header, BottomNav, Footer, Button, title }: Shell & { title?: string }) {
  const [location] = useLocation();
  const name = title ?? (location.replace("/", "").replace(/-/g, " ") || "This feature");
  return (
    <>
      <Header />
      <main className="container elbi-coming-soon">
        <img src="/brand/elbi-mark.png" alt="" />
        <p className="eyebrow">COMING SOON</p>
        <h1 style={{ textTransform: "capitalize" }}>{name}</h1>
        <p className="muted">This ELBI tab isn't built yet. Events, Bus Tours, Passport, and Ride Guide are live now.</p>
        <div className="elbi-cs-actions">
          <Button href="/events"><CalendarDays size={16} /> Browse Events</Button>
          <Button href="/" variant="secondary">Back home</Button>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
