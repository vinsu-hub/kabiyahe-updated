import { SkylineMotif } from "@/components/shell/SkylineMotif";
import { PageHero, RightRailCard, PassportPromoCard, CommunityStrip, StatTile } from "@/components/shell";
import { conceptImages } from "@/lib/conceptImages";
import "@/styles/pages/passport.css";
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
      <div className="elbiyahe-passport-card-heading"><WaxSealMark size={64} /><div><span className="script-accent">El-Biyahe!</span><strong>PASSPORT</strong></div></div>
      <div className="elbiyahe-passport-card-id">
        <span className="avatar">{initial}</span>
        <div><b>{displayName || "Explorer"}</b><span className="elbiyahe-badge ochre">{tierFor(explorerLevel)}</span>{joined && <small>Member since {joined}</small>}</div>
      </div>
      <div className="elbiyahe-passport-card-progress"><div><small>YOUR PASSPORT</small><IdentityQr payload={`${displayName ?? "explorer"}-${xp}`} /></div><div className="elbiyahe-passport-card-xp"><span>Level {explorerLevel} · {tierFor(explorerLevel)}</span><div className="progress"><span style={{ width: `${pct}%` }} /></div><small>{next ? `${xp} / ${next.at} XP to ${next.name}` : `${xp} XP · Max tier reached`}</small></div></div>
    </section>
  );
}

function PassportStats({ stampsCollected, xp, eventsJoinedCount }: { stampsCollected: number; xp: number; eventsJoinedCount: number }) {
  return <section className="elbiyahe-passport-stats"><h2>Passport Stats</h2><div className="elbiyahe-passport-stats-grid">
    <StatTile label="Stamps Collected" value={stampsCollected} icon={<Leaf size={22} />} />
    <StatTile label="Total XP" value={xp.toLocaleString()} icon={<Trophy size={22} />} />
    <StatTile label="Places Visited" value={stampsCollected} icon={<MapPin size={22} />} />
    <StatTile label="Events Joined" value={eventsJoinedCount} icon={<CalendarDays size={22} />} />
  </div></section>;
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
      <div className="elbiyahe-row-head"><h2>My Stamps</h2><span className="muted">{scannedLocationIds.length} / {locations.length} stamps collected</span></div>
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
      {locations.length === 0 && <p className="muted">Stamp locations are coming soon.</p>}
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
      <h2>Passport Missions</h2><p className="elbiyahe-section-intro">Complete missions to earn XP and stamps!</p>
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
  const rewardImage = (title: string) => /coffee|cafe/i.test(title) ? conceptImages.passportCoffeeReward : /pie|food|voucher/i.test(title) ? conceptImages.passportPieReward : conceptImages.passportToteReward;
  return <RightRailCard title="Redeem Rewards" className="elbiyahe-rewards-panel">
    {rewards.length === 0 && <p className="muted">No rewards available yet. Keep collecting stamps!</p>}
    {rewards.map(r => { const unlocked = stampsCollected >= r.required_stamps; const photo = rewardImage(r.title); return (
      <div key={r.id} className={`elbiyahe-reward ${unlocked ? "" : "locked"}`}>
        <img src={photo.src} alt="" /><div><b>{r.title}</b><small>{r.description}</small><em>{r.required_stamps} stamps</em></div><span className="elbiyahe-reward-state">{unlocked ? "Ready" : "Locked"}</span>
      </div>
    ); })}
    <p className="elbiyahe-reward-help">Collect stamps at participating locations to unlock rewards.</p>
  </RightRailCard>;
}


function LeaderboardPanel({ top, me, meInTop }: { top: LeaderboardRow[]; me: (LeaderboardRow & { rank: number }) | null; meInTop: boolean }) {
  return (
    <RightRailCard title="Passport Leaderboard" className="elbiyahe-leaderboard-panel">
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
    </RightRailCard>
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
        <PageHero className="elbiyahe-passport-hero" title="Your Los Baños Passport" subtitle="Explore. Collect. Earn." body="Explore Los Baños, collect stamps, and earn rewards from local partners." image={conceptImages.passportHero.src} imageAlt={conceptImages.passportHero.alt} actions={<button className="elbiyahe-scan-btn" onClick={() => (user ? setScanOpen(true) : navigate("/login?next=/passport"))}><QrCode size={19} /> Scan Passport</button>} rightCard={<div className="elbiyahe-hero-seal"><WaxSealMark size={120} /><span>COME CURIOUS · EL-BIYAHE!</span></div>} />

        {isLoading && user && <Loading />}
        {error && user && <LoadError message={(error as Error).message} />}

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
              <ShareJourneyCallout />
            </div>

            <aside className="side">
              <RedeemRewardsPanel rewards={data.rewards} stampsCollected={collected} />
              {!leaderboard.isLoading && leaderboard.data && (
                <LeaderboardPanel top={leaderboard.data.top} me={leaderboard.data.me} meInTop={leaderboard.data.meInTop} />
              )}
              <PassportPromoCard href="/explore" body="Explore more spots, collect stamps, and unlock rewards with your El-Biyahe! Passport." illustration={<StampBadge seed="passport" category="Nature" state="collected" size={108} />} />
            </aside>
          </div>
        )}

        <section className="elbiyahe-passport-why"><div><h2 className="script-accent">Why El-Biyahe! Passport?</h2><p>More than travel. It’s a journey that gives back.</p></div><CommunityStrip items={[
          { icon: <Leaf size={27} />, label: "Discover LB", detail: "Uncover local favorites and hidden gems." },
          { icon: <Star size={27} />, label: "Earn Rewards", detail: "Collect stamps and unlock perks." },
          { icon: <Users size={27} />, label: "Support Local", detail: "Every adventure helps our community grow." },
          { icon: <QrCode size={27} />, label: "Make Memories", detail: "Keep your Los Baños story in one place." },
        ]} /></section>
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
