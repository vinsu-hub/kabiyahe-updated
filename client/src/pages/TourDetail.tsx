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



const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent("elbiyahe:notice", { detail: message }));


const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;



function useSeasonName() {
  const { data } = useSeasons();
  return (key: string | null | undefined) =>
    (key && data?.find(s => s.key === key)?.name.replace(/^El-Biyahe!\s*/, "")) || "";
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



function Stars({ value }: { value: number }) {
  return (
    <span className="rating" aria-label={`${value} out of 5`}>
      <Star size={14} fill="currentColor" /> {value.toFixed(1)}
    </span>
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
