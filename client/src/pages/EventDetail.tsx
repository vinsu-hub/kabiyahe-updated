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


export function LoadError({ message }: { message?: string }) {
  return (
    <div className="empty-state">
      <QrCode size={24} />
      <h3>Couldn't load this yet.</h3>
      <p>{message || "Check your connection and try again."}</p>
    </div>
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
