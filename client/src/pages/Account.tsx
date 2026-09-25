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
import { Header, BottomNav, Footer, Button, Tag, SectionTitle, SaveButton, DestinationCard, IMG, notify } from "@/components/shell/legacy";

export function Account({savedOnly=false}:{savedOnly?:boolean}) {
  const { profile, user, isAuthenticated, isAdmin, signOut, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate(`/login?next=${savedOnly ? "/saved" : "/account"}`);
  }, [loading, isAuthenticated, savedOnly, navigate]);
  if (!loading && !isAuthenticated) return null;
  const name = profile?.display_name ?? "Explorer";
  if (savedOnly) return <><Header/><main className="container account-page">
    <div className="account-head">
      <div className="large-avatar">{name.charAt(0).toUpperCase()}</div>
      <div><p className="eyebrow">YOUR El-Biyahe!</p><h1>Saved for later</h1><p className="muted">{name}{user?.email ? ` · ${user.email}` : ""}</p></div>
    </div>
    <div className="empty-state"><Heart size={26}/><h3>Nothing saved yet.</h3><p>Tap the heart on any destination, event, or stay to keep it here.</p><Button href="/explore">Browse destinations</Button></div>
  </main><Footer/><BottomNav/></>;
  return <><Header/><main className="container account-page">
    <div className="account-head">
      <div className="large-avatar">{name.charAt(0).toUpperCase()}</div>
      <div><p className="eyebrow">YOUR El-Biyahe!</p><h1>Profile</h1><p className="muted">{name}{user?.email ? ` · ${user.email}` : ""}</p></div>
      <Button href="/passport"><Sparkles size={16}/> Open Passport</Button>
    </div>
    <div className="account-grid">
      <section className="side-card"><h2><Sparkles size={19}/> Explorer</h2><p className="muted">Level {profile?.explorer_level ?? 1} · {profile?.xp ?? 0} XP</p><Link className="saved-row" href="/passport"><span><b>Digital LB Passport</b><small>Stamp progress &amp; rewards</small></span><ChevronRight size={16}/></Link></section>
      <section className="side-card"><h2><CalendarDays size={19}/> Discover</h2><Link className="saved-row" href="/events"><span><b>Events</b><small>Browse what's on</small></span><ChevronRight size={16}/></Link><Link className="saved-row" href="/tours"><span><b>Bus Tours</b><small>Curated day tours</small></span><ChevronRight size={16}/></Link></section>
    </div>
    <section className="side-card account-preferences">
      <h2>Account</h2>
      {isAdmin && <Link className="saved-row" href="/admin"><span><b>Admin dashboard</b></span><ChevronRight size={16}/></Link>}
      <button className="btn outline" onClick={async () => { await signOut(); notify("You are signed out."); navigate("/"); }}>Sign out</button>
    </section>
  </main><Footer/><BottomNav/></>;
}
