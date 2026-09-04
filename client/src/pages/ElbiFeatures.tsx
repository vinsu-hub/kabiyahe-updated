/* ELBI ("Come Curious") — priority feature tabs: Events, Bus Tours, Passport,
   Ride Guide, and a shared Coming Soon placeholder. Frontend-only, mock data
   from @/lib/elbiData. Shared shell components (Header/BottomNav/Footer/Button/
   Tag) are passed in from App.tsx, matching the existing Guides.tsx pattern. */
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, BadgeCheck, Bookmark, Bus, CalendarDays, Check, ChevronRight,
  Clock3, Compass, ExternalLink, Heart, List, MapPin, Navigation, QrCode, Share2, Sparkles,
  Star, Ticket, Users, Utensils,
} from "lucide-react";
import {
  EVENTS, TOURS, PASSPORT, SEASONS, CURRENT_SEASON, JEEP_ROUTES, TRICYCLE_ZONES,
  RIDE_TIPS, type ElbiEvent, type TourPackage,
} from "@/lib/elbiData";

interface Shell {
  Header: React.ComponentType;
  BottomNav: React.ComponentType;
  Footer: React.ComponentType;
  Button: React.ComponentType<any>;
  Tag: React.ComponentType<any>;
}

const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent("kabiyahe:notice", { detail: message }));
const seasonName = (key: string) => SEASONS.find(s => s.key === key)?.name ?? key;
const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

function Stars({ value }: { value: number }) {
  return (
    <span className="rating" aria-label={`${value} out of 5`}>
      <Star size={14} fill="currentColor" /> {value.toFixed(1)}
    </span>
  );
}

/* ============================ EVENTS ============================ */

const EVENT_CATEGORIES = ["All", "Culture", "Sports", "Arts", "Community"] as const;
const EVENT_GROUPS: { key: ElbiEvent["status"][]; label: string }[] = [
  { key: ["live", "today"], label: "Today" },
  { key: ["week"], label: "This Week" },
  { key: ["season"], label: "This Season" },
  { key: ["recap"], label: "Past — Recaps" },
];

function EventCard({ e, Tag }: { e: ElbiEvent; Tag: Shell["Tag"] }) {
  return (
    <Link href={`/events/${e.id}`} className="elbi-event-card">
      <div className="elbi-event-card-media">
        <img src={e.image} alt={e.title} />
        {e.status === "live" && <span className="elbi-badge live">LIVE NOW</span>}
        {e.status === "recap" && <span className="elbi-badge grey">RECAP</span>}
      </div>
      <div className="elbi-event-card-body">
        <div className="elbi-chip-row">
          <Tag>{e.category}</Tag>
          <span className="muted"><CalendarDays size={13} /> {e.date} · {e.time}</span>
        </div>
        <h3>{e.title}</h3>
        <p className="muted"><MapPin size={13} /> {e.venue}</p>
        <p className="muted"><Users size={13} /> {e.attendees.toLocaleString()} going</p>
      </div>
    </Link>
  );
}

export function EventsList({ Header, BottomNav, Footer, Tag }: Shell) {
  const [category, setCategory] = useState<(typeof EVENT_CATEGORIES)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");
  const [season, setSeason] = useState<string>("all");

  const filtered = useMemo(
    () => EVENTS.filter(e =>
      (category === "All" || e.category === category) &&
      (season === "all" || e.season === season)),
    [category, season],
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
              {SEASONS.map(s => <option key={s.key} value={s.key}>{s.q} · {s.name}</option>)}
            </select>
          </label>
        </div>

        {view === "map" ? (
          <div className="elbi-map-field">
            <div className="map-copy">Los Baños<br /><small>Laguna</small></div>
            {filtered.map((e, i) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
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
        )}

        {filtered.length === 0 && (
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
  const e = EVENTS.find(x => x.id === id) ?? EVENTS[0];
  const [tab, setTab] = useState<"About" | "Schedule" | "Organizers" | "Updates">("About");
  const [rsvp, setRsvp] = useState(false);
  const [saved, setSaved] = useState(false);
  const past = e.status === "recap";

  return (
    <>
      <Header />
      <main className="container elbi-detail">
        <Link href="/events" className="back-link"><ArrowLeft size={16} /> Back to Events</Link>

        <section className="elbi-detail-hero">
          <img src={e.image} alt={e.title} />
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
          <Tag tone="ochre">{seasonName(e.season)}</Tag>
        </div>
        <h1>{e.title}</h1>
        <div className="elbi-detail-facts">
          <span><CalendarDays size={15} /> {e.date} · {e.time}</span>
          <span><MapPin size={15} /> {e.venue}, Brgy. {e.barangay}</span>
          <span><Users size={15} /> {e.attendees.toLocaleString()} going</span>
        </div>

        {!past && (
          <div className="elbi-rsvp-row">
            <button className={`elbi-rsvp ${rsvp ? "done" : ""}`} onClick={() => { setRsvp(v => !v); notify(rsvp ? "RSVP cancelled" : "You're going! RSVP saved."); }}>
              {rsvp ? <><Check size={17} /> You're going</> : "RSVP to this event"}
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
            e.schedule.length ? (
              <ol className="elbi-schedule">
                {e.schedule.map(s => (
                  <li key={s.time} className={s.state ?? ""}>
                    <span className="elbi-schedule-time">{s.time}</span>
                    <span>{s.item}</span>
                    {s.state === "live" && <span className="elbi-badge live sm">LIVE</span>}
                    {s.state === "done" && <span className="elbi-badge grey sm">DONE</span>}
                  </li>
                ))}
              </ol>
            ) : <p className="muted">Full schedule to be announced.</p>
          )}
          {tab === "Organizers" && (
            <div className="elbi-organizer"><BadgeCheck size={18} /> <span>{e.organizer}</span></div>
          )}
          {tab === "Updates" && (
            e.updates.length ? e.updates.map((u, i) => (
              <div key={i} className="elbi-update"><b>{u.ago}</b><p>{u.text}</p></div>
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

function TourCard({ t }: { t: TourPackage }) {
  return (
    <Link href={`/tours/${t.id}`} className="elbi-tour-card">
      <div className="elbi-tour-card-media">
        <img src={t.image} alt={t.title} />
        {t.featured && <span className="elbi-badge ochre">FEATURED</span>}
      </div>
      <div className="elbi-tour-card-body">
        <div className="elbi-chip-row">{t.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
        <h3>{t.title}</h3>
        <p className="muted"><Clock3 size={13} /> {t.duration}&nbsp;&nbsp;·&nbsp;&nbsp;<Bus size={13} />&nbsp;{t.operatorName}</p>
        <div className="elbi-tour-card-foot">
          <b>{peso(t.pricePerSeat)}<small> /seat</small></b>
          <span className="rating"><Star size={13} fill="currentColor" /> {t.rating.toFixed(1)} <small>({t.reviewCount})</small></span>
        </div>
      </div>
    </Link>
  );
}

export function BusTours({ Header, BottomNav, Footer }: Shell) {
  const [filter, setFilter] = useState<(typeof TOUR_FILTERS)[number]>("All");
  const list = filter === "All" ? TOURS : TOURS.filter(t => t.tags.includes(filter));

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

        <div className="elbi-tour-grid">
          {list.map(t => <TourCard key={t.id} t={t} />)}
        </div>
        {list.length === 0 && (
          <div className="empty-state"><Bus size={26} /><h3>No packages in that category yet.</h3><p>Try another filter.</p></div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

export function TourDetail({ Header, BottomNav, Footer, Button, Tag, id }: Shell & { id?: string }) {
  const t = TOURS.find(x => x.id === id) ?? TOURS[0];
  const soldOutSoon = t.seatsAvailable <= 10;

  const reserve = () => {
    /* Referral-only model (architecture decision #1) — no in-app payment.
       Log a ReferralEvent stub and hand off to the operator's own channel. */
    console.info("[ReferralEvent]", { type: "tour_reservation", packageId: t.id, operator: t.operatorName, ts: new Date().toISOString() });
    notify("Opening the tour operator's booking channel — ELBI never processes payment.");
    window.open(t.reserveUrl, "_blank", "noopener");
  };

  return (
    <>
      <Header />
      <main className="container elbi-detail">
        <Link href="/tours" className="back-link"><ArrowLeft size={16} /> Back to Bus Tours</Link>

        <section className="elbi-detail-hero">
          <img src={t.image} alt={t.title} />
          {t.featured && <span className="elbi-badge ochre">FEATURED</span>}
        </section>

        <div className="elbi-chip-row">
          {t.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          {t.seasonTag && <Tag tone="ochre">{seasonName(t.seasonTag)} season</Tag>}
        </div>
        <h1>{t.title}</h1>
        <p className="muted"><Bus size={14} /> Operated by {t.operatorName}</p>
        <p>{t.summary}</p>

        <div className="elbi-tour-meta">
          <div><b>{peso(t.pricePerSeat)}</b><small>per seat</small></div>
          <div><b>{t.duration}</b><small>duration</small></div>
          <div><b>{t.rating.toFixed(1)} ★</b><small>{t.reviewCount} reviews</small></div>
          <div><b className={soldOutSoon ? "warn" : ""}>{t.seatsAvailable}</b><small>of {t.seatCapacity} seats left</small></div>
        </div>

        <div className="elbi-tour-logistics">
          <div>
            <h3><MapPin size={15} /> Pickup points</h3>
            <ul>{t.originPickupPoints.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <h3><CalendarDays size={15} /> Departures</h3>
            <p>{t.departureSchedule}</p>
          </div>
          <div>
            <h3><Check size={15} /> What's included</h3>
            <ul>{t.includes.map(i => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>

        <section className="elbi-itinerary">
          <h2>Itinerary</h2>
          <ol>
            {t.itineraryStops.map((s, i) => (
              <li key={i}>
                <span className="elbi-itinerary-time">{s.time}</span>
                <div><b>{s.name}</b><p className="muted">{s.blurb}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <div className="elbi-reserve-bar">
          <div>
            <b>{peso(t.pricePerSeat)} <small>/ seat</small></b>
            <small className="muted">{t.seatsAvailable} seats left · referral booking</small>
          </div>
          <Button onClick={reserve}><Ticket size={16} /> Reserve Seat</Button>
        </div>
        <p className="elbi-referral-note"><ExternalLink size={13} /> Reserving opens {t.operatorName}'s own booking channel. ELBI logs the referral but never processes payment.</p>

        <section className="elbi-reviews">
          <h2>Reviews</h2>
          {t.reviews.map((r, i) => (
            <div key={i} className="elbi-review">
              <div className="elbi-review-head"><b>{r.name}</b><Stars value={r.rating} /></div>
              <p>{r.text}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

/* ============================ PASSPORT ============================ */

export function Passport({ Header, BottomNav, Footer, Button }: Shell) {
  const [collected, setCollected] = useState(PASSPORT.stampsCollected);
  const [code, setCode] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [lastStamp, setLastStamp] = useState<{ name: string; category: string } | null>(null);
  const [caught, setCaught] = useState<string[]>([]);

  const pct = Math.round((collected / PASSPORT.stampsTotal) * 100);

  const submitCode = () => {
    const key = code.trim().toUpperCase();
    const match = PASSPORT.validCodes[key];
    if (!match) { notify("That code isn't a valid ELBI Passport QR."); return; }
    if (caught.includes(key)) { notify("You've already collected this stamp."); return; }
    setCaught(c => [...c, key]);
    setCollected(n => Math.min(PASSPORT.stampsTotal, n + 1));
    setLastStamp(match);
    setCode("");
    setScanOpen(false);
    notify(`New stamp collected — ${match.name}!`);
  };

  const track = PASSPORT.seasonTrack;

  return (
    <>
      <Header />
      <main className="container elbi-page elbi-passport">
        <div className="elbi-passport-header">
          <img src="/scenes/elbi-passport.svg" alt="" />
          <div>
            <span className="elbi-badge ochre">EXPLORER · LEVEL {PASSPORT.explorerLevel}</span>
            <h1>Digital LB Passport</h1>
            <p className="muted">{collected} / {PASSPORT.stampsTotal} stamps collected</p>
            <div className="progress"><span style={{ width: `${pct}%` }} /></div>
          </div>
        </div>

        <button className="elbi-scan-btn" onClick={() => setScanOpen(true)}>
          <QrCode size={20} /> Scan Passport
        </button>

        {lastStamp && (
          <div className="elbi-stamp-success">
            <Sparkles size={22} />
            <div>
              <b>New Stamp Collected!</b>
              <span>{lastStamp.name.toUpperCase()} — {lastStamp.category.toUpperCase()}</span>
              <small>{collected}/{PASSPORT.stampsTotal} · +1 {lastStamp.category} discovery</small>
            </div>
          </div>
        )}

        <section className="elbi-stamp-cats">
          <h2>Stamps by category</h2>
          <div className="elbi-stamp-cat-grid">
            {PASSPORT.categories.map(c => (
              <div key={c.name} className={`elbi-stamp-cat ${c.tone}`}>
                <b>{c.collected}</b>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="elbi-nearby-stamps">
          <h2>Nearby stamps</h2>
          <ul>
            {PASSPORT.nearby.map(s => (
              <li key={s.id}>
                <span className={`dot ${s.category === "Nature" ? "nature" : s.category === "Culture" ? "culture" : s.category === "Food" ? "food" : "gem"}`} />
                <div><b>{s.name}</b><small className="muted">{s.category} · {s.distance}</small></div>
                <ChevronRight size={16} />
              </li>
            ))}
          </ul>
        </section>

        <section className="elbi-season-track">
          <div className="elbi-season-track-head">
            <div>
              <span className="eyebrow">{CURRENT_SEASON.q} · {CURRENT_SEASON.name.toUpperCase()}</span>
              <h2>Season Track</h2>
            </div>
            <b>{track.collected}/{track.total}</b>
          </div>
          <div className="elbi-season-checklist">
            {track.checklist.map(c => (
              <span key={c.name} className={c.done ? "done" : ""}>
                {c.done ? <Check size={14} /> : <span className="ring" />} {c.name}
              </span>
            ))}
          </div>
          <div className="elbi-rewards">
            {PASSPORT.rewards.map(r => (
              <div key={r.title} className={`elbi-reward ${r.status}`}>
                <Ticket size={16} />
                <div><b>{r.title}</b><small>{r.note}</small></div>
                <span className="elbi-reward-state">{r.status === "locked" ? "Locked" : "Ready"}</span>
              </div>
            ))}
          </div>
        </section>
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
            <Button onClick={submitCode}>Collect stamp</Button>
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

        <section className="elbi-routes">
          <h2>Popular jeepney routes</h2>
          <div className="elbi-route-list">
            {JEEP_ROUTES.map(r => (
              <div key={r.route} className="elbi-route-row">
                <div className="elbi-route-row-head"><b>{r.route}</b><span className="tag">{r.mode}</span></div>
                <p className="muted">{r.fare} · {r.frequency}</p>
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
            {TRICYCLE_ZONES.map(z => (
              <div key={z.zone} className="elbi-route-row">
                <div className="elbi-route-row-head"><b>{z.zone}</b></div>
                <p className="muted">{z.fare}</p>
                <p>{z.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="elbi-tips">
          <h2>Local travel tips</h2>
          <ul>{RIDE_TIPS.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </section>
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
