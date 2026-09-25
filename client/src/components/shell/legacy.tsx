/* El-Biyahe! — Come Curious. Los Baños field-companion web app. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useCurrentSeason, useDestination, useDestinations, useEvents, useTours } from "@/lib/supabase/queries";
import type { DestinationRow } from "@/lib/supabase/types";
import { MapView, type LBPoint } from "@/components/MapView";
import { Rating } from "@/components/Rating";
import { directionsUrl, distanceKm, isLosBanos, LB_CENTER, useUserLocation } from "@/lib/geo";
import { BusTours, Delicacies, EventDetail, EventsList, HeritageWalk, Loading, LoadError, Parking, Passport, RideGuide, StayEat, TourDetail } from "@/pages/ElbiyaheFeatures";
import { Auth } from "@/pages/Auth";
import { RequireAdmin } from "@/pages/admin/AdminShell";
import { AdminAccommodations, AdminDashboard, AdminDelicacies, AdminDestinations, AdminEvents, AdminParkingSpots, AdminPassport, AdminTours } from "@/pages/admin/AdminPages";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Archive, BadgeAlert, Bell, BellRing, Bookmark, CalendarDays, Car, Check, CheckCheck, ChevronDown,
  ChevronRight, Clock3, Compass, ExternalLink, Grid2X2, Heart, Landmark, List,
  Map, MapPin, Menu, Megaphone, MoonStar, Mountain, Navigation, Pencil, Plus, Radio, Search, Share2,
  SlidersHorizontal, Sparkles, Ticket, Users, Utensils, WalletCards, X, ShieldCheck
} from "lucide-react";


// Scenic stock photography lives in the gitignored client/public/assets/ — run
// `pnpm assets:download` (pulls the verified GitHub-release archive). El-Biyahe! logo
// art is committed under client/public/brand/.
export const IMG = {
  hero: "/assets/elbiyahe-hero-losbanos.jpg",
  emblem: "/brand/elbiyahe-mark.png",
  logoH: "/brand/elbiyahe-logo-horizontal.png",
};


export const notify = (message: string) => window.dispatchEvent(new CustomEvent("elbiyahe:notice", { detail: message }));



// Destinations now live in Supabase (see lib/supabase/queries.ts useDestinations/useDestination).
// icon_key on each row resolves to one of these lucide icons for display.
const DESTINATION_ICONS: Record<string, any> = { Mountain, Landmark, Sparkles, Compass, Utensils, WalletCards };



export function NoticeHost() {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const handler = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setNotice(message);
      window.setTimeout(() => setNotice(""), 2600);
    };
    window.addEventListener("elbiyahe:notice", handler);
    return () => window.removeEventListener("elbiyahe:notice", handler);
  }, []);
  return notice ? <div className="notice" role="status"><Check size={16}/>{notice}</div> : null;
}



export const NAV_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Explore", href: "/explore" },
  { label: "Delicacies", href: "/delicacies" },
  { label: "Ride Guide", href: "/ride-guide" },
  { label: "Parking", href: "/parking" },
  { label: "Stay & Eat", href: "/stay-eat" },
  { label: "Bus Tours", href: "/tours" },
  { label: "Passport", href: "/passport" },
];


export function Header() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, isAdmin, profile, signOut } = useAuth();
  const initial = (profile?.display_name ?? "?").charAt(0).toUpperCase();
  return <>
    <header className="topbar elbiyahe-topbar">
      <Link href="/" className="brand elbiyahe-brand"><img src={IMG.logoH} alt="El-Biyahe! — Come Curious"/></Link>
      <nav>{NAV_LINKS.map(n => <Link key={n.href} className={location.startsWith(n.href) ? "active" : ""} href={n.href}>{n.label}</Link>)}</nav>
      <div className="header-actions">
        <button className="icon-btn shell-search-pill" aria-label="Search" onClick={() => notify("Search across events, places, food, and tours — coming soon.")}><Search size={19}/><span>Search</span></button>
        <button className="icon-btn" aria-label="Notifications" onClick={() => notify("You're all caught up.")}><Bell size={20}/></button>
        {isAuthenticated ? (
          <button className="profile-trigger" aria-label="Open account menu" onClick={() => setProfileOpen(v => !v)}><span className="avatar">{initial}</span><ChevronDown size={16}/></button>
        ) : (
          <Link href="/login" className="btn primary" style={{ minHeight: 36, padding: "0 14px" }}>Sign in</Link>
        )}
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={22}/></button>
        {profileOpen && isAuthenticated && (
          <div className="profile-menu">
            <b>{profile?.display_name ?? "Explorer"}</b>
            <Link href="/account" onClick={() => setProfileOpen(false)}>Profile &amp; saved</Link>
            {isAdmin && <Link href="/admin" onClick={() => setProfileOpen(false)}>Admin</Link>}
            <button onClick={() => { setProfileOpen(false); signOut(); notify("Signed out."); }}>Sign out</button>
          </div>
        )}
      </div>
    </header>
    {menuOpen && <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}><div className="mobile-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><b>Come curious</b><button onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20}/></button></div><Link href="/" onClick={() => setMenuOpen(false)}>Home<ChevronRight size={16}/></Link>{NAV_LINKS.map(n => <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}<ChevronRight size={16}/></Link>)}<Link href="/account" onClick={() => setMenuOpen(false)}>Profile<ChevronRight size={16}/></Link></div></div>}
  </>;
}


export function ScrollToTop() { const [location] = useLocation(); useEffect(() => { if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [location]); return null; }


export function BottomNav() { const [location] = useLocation(); const items=[{href:"/",label:"Home",icon:Compass},{href:"/events",label:"Events",icon:CalendarDays},{href:"/passport",label:"Passport",icon:Ticket},{href:"/explore",label:"Explore",icon:Map},{href:"/account",label:"Profile",icon:Users}]; return <div className="bottom-nav">{items.map(n => {const I=n.icon; const active=n.href==="/"?location==="/":location.startsWith(n.href); return <Link className={active?"active":""} href={n.href} key={n.href}><I size={19}/><span>{n.label}</span></Link>})}</div> }


export function Tag({children, tone="sage"}:{children:React.ReactNode;tone?:string}) { return <span className={`tag ${tone}`}>{children}</span> }


export function Button({children, variant="primary", href, onClick, type="button", disabled=false}:{children:React.ReactNode;variant?:string;href?:string;onClick?:()=>void;type?:"button"|"submit";disabled?:boolean}) { const cls=`btn ${variant}`; return href ? <Link href={href} className={cls} aria-disabled={disabled}>{children}</Link> : <button type={type} onClick={onClick} className={cls} disabled={disabled}>{children}</button> }


export function SectionTitle({eyebrow,title,action}:{eyebrow?:string;title:string;action?:React.ReactNode}) { return <div className="section-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{action && <div className="section-action">{action}</div>}</div> }


export function Footer() { return <footer className="site-footer shell-footer"><div className="container footer-inner"><div className="footer-brand"><Link href="/" className="footer-logo"><img src={IMG.logoH} alt="El-Biyahe! — Come Curious"/></Link><p>Your field companion for discovering the many sides of Los Baños — events, places, flavors, and stories worth collecting.</p></div><nav className="footer-links" aria-label="Footer navigation"><div><b>Discover</b><Link href="/events">Events</Link><Link href="/explore">Explore</Link><Link href="/delicacies">Delicacies</Link><Link href="/tours">Bus Tours</Link></div><div><b>Get around</b><Link href="/ride-guide">Ride Guide</Link><Link href="/parking">Parking</Link><Link href="/stay-eat">Stay &amp; Eat</Link></div><div><b>Your El-Biyahe!</b><Link href="/passport">Digital LB Passport</Link><Link href="/account">Profile</Link></div></nav><div className="footer-bottom"><span>© 2026 El-Biyahe! · Los Baños</span><span>Come Curious.</span></div></div></footer> }


export function SaveButton({label="Save"}:{label?:string}) { const [saved,setSaved] = useState(false); return <button className={`save ${saved?"saved":""}`} aria-label={saved?"Remove saved item":label} onClick={(e) => {e.preventDefault();e.stopPropagation();setSaved(v=>!v);notify(saved?"Removed from saved":"Saved for later");}}>{saved?<Heart size={17} fill="currentColor"/>:<Heart size={17}/>}</button> }


export function DestinationCard({d, compact=false}:{d:DestinationRow;compact?:boolean}) { const Icon=DESTINATION_ICONS[d.icon_key]||Compass; const href=`/explore/${d.slug}`; return <article className={`destination-card ${compact?"compact":""}`}><Link href={href} className="image-wrap"><img src={d.hero_image||IMG.hero} alt={d.name}/>{d.placeholder&&<Tag tone="ochre">Placeholder listing</Tag>}</Link><SaveButton/><div className="card-body"><div className="card-heading"><Link href={href}><h3>{d.name}</h3></Link><Icon size={16} className="type-icon"/></div><p className="muted"><MapPin size={14}/>{d.place}</p><p className="desc">{d.description}</p><div className="card-footer"><Tag>{d.type}</Tag><Rating value={d.rating} count={d.review_count}/></div></div></article> }
