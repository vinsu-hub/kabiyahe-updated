import { DataUnavailable } from "@/components/shell/DataUnavailable";
import "@/styles/pages/heritage-walk.css";
import { PageHero } from "@/components/shell";
import { conceptImages } from "@/lib/conceptImages";
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



/* ======================= HERITAGE WALK ======================= */

export function HeritageWalk({ Header, BottomNav, Footer }: Shell) {
  const { data: stops, isLoading, error, refetch } = useHeritageWalk();
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
        <Link href="/explore" className="back-link"><ArrowLeft size={16} /> Back to Explore</Link>
        <PageHero className="heritage-walk-hero" eyebrow="SELF-GUIDED · ~2.5 KM ON FOOT" title="Los Baños Heritage Walk" body={'For over 400 years, Los Baños has been a sanctuary for rest and rejuvenation. This 17-stop walk traces the places that shaped the town — from the 1613 Immaculate Conception Parish and the ruins of Agua Santa Resort to the old train station, Baker Hall, and the hot springs that gave “The Baths” its name. Start anywhere along the route; most stops sit within the poblacion, with a few on the UPLB campus.'} image={conceptImages.toursHeritageChurch.src} imageAlt={conceptImages.toursHeritageChurch.alt} />

        {isLoading && <Loading />}
        {error && <DataUnavailable onRetry={refetch} />}

        {!isLoading && !error && stops?.length === 0 && <div className="empty-state"><Footprints size={26}/><h2>Trail stops are unavailable right now.</h2><p>Please check back for the map and directions.</p></div>}

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
          </>
        )}
        <section className="elbiyahe-location-section">
          <h2>Make it a trip</h2>
          <div className="elbiyahe-cv-grid">
            <Link href="/passport" className="elbiyahe-cv-item"><QrCode size={18} /> Collect Passport stamps</Link>
            <Link href="/ride-guide" className="elbiyahe-cv-item"><Navigation size={18} /> How to get around</Link>
            <Link href="/delicacies" className="elbiyahe-cv-item"><Utensils size={18} /> Eat along the way</Link>
            <Link href="/explore" className="elbiyahe-cv-item"><Compass size={18} /> More of Los Baños</Link>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
