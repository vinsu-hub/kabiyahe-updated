import { DataUnavailable } from "@/components/shell/DataUnavailable";
import "@/styles/pages/bus-tours.css";
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


const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;



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



const TOUR_THEME_BADGE: Record<TourTheme, string> = {
  Nature: "var(--forest)", Culture: "#b25b32", Food: "#d99a1e", Science: "#2f7d84",
};


const TOUR_GUIDES: { title: string; body: string; theme: TourTheme; href?: string }[] = [
  { title: "Nature Day", body: "Hot springs, forests & mountain views", theme: "Nature" },
  { title: "Heritage Day", body: "History, culture & local landmarks", theme: "Culture", href: "/heritage-walk" },
  { title: "Food Trip", body: "Local flavors & must-try spots", theme: "Food" },
  { title: "Science & Discovery", body: "UPLB and Laguna's scientific heritage", theme: "Science" },
];


const MOOD_TILES: { theme: TourTheme; photo: string; title: string; body: string }[] = [
  { theme: "Nature", photo: "/tours/misty-mountains.jpg", title: "Breathe in Los Baños", body: "Makiling, springs, trails and green spaces." },
  { theme: "Culture", photo: "/tours/heritage-church.jpg", title: "Stories of Los Baños", body: "Heritage sites, landmarks and local history." },
  { theme: "Food", photo: "/tours/food-spread.jpg", title: "Taste Laguna", body: "Local restaurants, specialities and food stops." },
  { theme: "Science", photo: "/tours/uplb-campus.jpg", title: "Discover UPLB", body: "Science, agriculture and the university community." },
];


const DAY_EASE: { icon: typeof Bus; label: string; body: string }[] = [
  { icon: Bus, label: "Transport", body: "Comfortable group transportation" },
  { icon: Compass, label: "Local Guide", body: "Know the story behind every stop" },
  { icon: MapPin, label: "Curated Stops", body: "The places worth your time" },
  { icon: Utensils, label: "Local Experiences", body: "Taste and experience Los Baños" },
];



/** Timeline badge icon for a planner stop, by keyword. */
function stopIcon(name: string) {
  const n = name.toLowerCase();
  if (/depart|meet|pickup|return/.test(n)) return n.includes("return") ? <Check size={12} /> : <Bus size={12} />;
  if (/lunch|merienda|meal|eat|food|tasting|dairy|pie|cake/.test(n)) return <Utensils size={12} />;
  if (/museum|church|parish|hall|heritage|cathedral|shrine|station|carillon/.test(n)) return <Landmark size={12} />;
  if (/souvenir|coffee|pasalubong|market/.test(n)) return <ShoppingBag size={12} />;
  return <MapPin size={12} />;
}



const scrollToResults = () =>
  document.getElementById("tours-results")?.scrollIntoView({ behavior: "smooth", block: "start" });



function TourCard({ t, saved, onToggleSave }: {
  t: TourListItem;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const stopNames = t.stops.map(s => s.name.replace(/\s*[—-]\s*.*/, "").trim());
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
          <p className="muted elbiyahe-tour-card-stops">{stopNames.slice(0, 4).join(" • ")}{stopNames.length > 4 ? " • …" : ""}</p>
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
  const { data: tours, isLoading, error, refetch } = useTours();
  const [theme, setTheme] = useState<TourTheme | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const all = tours ?? [];
  const featured = all.find(t => t.featured) ?? all[0] ?? null;
  const list = all.filter(t =>
    (!theme || t.tags.includes(theme)) &&
    (!duration || (duration === "Half Day" ? isHalfDay(t.duration) : !isHalfDay(t.duration))),
  );
  const filtered = Boolean(theme || duration);
  const visible = showAll || filtered ? list : list.slice(0, 4);
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
            <h1>Explore Los Baños <span className="elbiyahe-tours-hero-accent">by bus.</span></h1>
            <p>Curated day trips connecting the places, flavors, science, and stories that make Los Baños special.</p>
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
                  <span className="elbiyahe-tours-guide-icon" style={{ background: TOUR_THEME_BADGE[g.theme] }}><Icon size={16} /></span>
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
            <span className="elbiyahe-tours-filter-intro-icon"><Leaf size={18} /></span>
            <div><b>Find your tour</b><small>Tell us what you're looking for and we'll help plan your day.</small></div>
          </div>
          <div className="elbiyahe-tours-filter-groups">
            <div className="elbiyahe-tours-filter-group">
              <label>Who are you traveling with?</label>
              <div className="filter-pills">
                {TOUR_AUDIENCE.map(a => {
                  const Icon = a.icon;
                  return <button key={a.key} type="button" className={audience === a.key ? "active" : ""} onClick={() => setAudience(cur => (cur === a.key ? null : a.key))}><Icon size={13} /> {a.key}</button>;
                })}
              </div>
            </div>
            <div className="elbiyahe-tours-filter-group">
              <label>What kind of day?</label>
              <div className="filter-pills">
                {TOUR_THEMES.map(th => {
                  const Icon = th.icon;
                  return <button key={th.key} type="button" className={theme === th.key ? "active" : ""} onClick={() => setTheme(cur => (cur === th.key ? null : th.key))}><Icon size={13} /> {th.key}</button>;
                })}
              </div>
            </div>
            <div className="elbiyahe-tours-filter-group">
              <label>How much time?</label>
              <div className="filter-pills">
                {TOUR_DURATIONS.map(d => {
                  const Icon = d.icon;
                  return <button key={d.key} type="button" className={duration === d.key ? "active" : ""} onClick={() => setDuration(cur => (cur === d.key ? null : d.key))}><Icon size={13} /> {d.key}</button>;
                })}
              </div>
            </div>
          </div>
          <Button onClick={scrollToResults}>Find My Tour <ArrowRight size={15} /></Button>
        </section>

        {/* 3 — POPULAR TOURS + PLANNER */}
        <div className="elbiyahe-tours-body" id="tours-results">
          <section className="elbiyahe-tours-main">
            <div className="elbiyahe-row-head">
              <h2>Popular Tours</h2>
              {filtered
                ? <button type="button" className="link-accent" onClick={resetFilters}>See all tours <ArrowRight size={13} /></button>
                : list.length > 4 && <button type="button" className="link-accent" onClick={() => setShowAll(v => !v)}>{showAll ? "Show less" : "See all tours"} <ArrowRight size={13} /></button>}
            </div>
            {isLoading && <Loading />}
            {error && <DataUnavailable onRetry={refetch} />}
            {!isLoading && !error && (
              list.length > 0 ? (
                <div className="elbiyahe-tour-grid">
                  {visible.map(t => <TourCard key={t.id} t={t} saved={saved.has(t.id)} onToggleSave={() => toggleSave(t.id)} />)}
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
              <span className="eyebrow elbiyahe-tours-planner-head">PLAN YOUR LOS BAÑOS DAY</span>
              <div className="elbiyahe-tours-planner-inner">
                <ol className="elbiyahe-tours-timeline">
                  {featured.stops.map(s => (
                    <li key={s.sort}>
                      <span className="elbiyahe-tours-timeline-icon">{stopIcon(s.name)}</span>
                      <b>{s.time_label}</b><span>{s.name}</span>
                    </li>
                  ))}
                </ol>
                <div className="elbiyahe-tours-yourday">
                  <b>YOUR DAY</b>
                  <p><MapPin size={14} /> {featured.stops.length} destinations</p>
                  <p><Bus size={14} /> Transportation included</p>
                  <p><Utensils size={14} /> {lunchLine}</p>
                  <p><Clock3 size={14} /> {featured.duration}</p>
                </div>
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
                  <span className="elbiyahe-tours-mood-icon" style={{ background: TOUR_THEME_BADGE[m.theme] }}><Icon size={16} /></span>
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
              <p>A full day of nature, heritage &amp; local flavors.</p>
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
