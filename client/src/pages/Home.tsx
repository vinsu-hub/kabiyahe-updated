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


const destPoints = (rows: DestinationRow[] | undefined): LBPoint[] =>
  (rows ?? [])
    .filter(d => d.lat != null && d.lng != null)
    .map(d => ({ id: d.id, lat: d.lat!, lng: d.lng!, name: d.name, kind: d.type, href: `/explore/${d.slug}`, sub: d.place ?? undefined }));



const airbnbLosBanosUrl = "https://www.airbnb.com/s/Los-Banos--Laguna--Philippines/homes";


const localSpots = [
  { name: "Elbi Community Sunday Market", type: "Food market", schedule: "Sundays · 7:00 AM–12:00 PM", place: "Umali Subd., Batong Malake", description: "Fresh produce, prepared food, baked treats, and local makers in a community market setting.", source: "https://www.facebook.com/elbicommunitymarket/" },
  { name: "Elbi Community Night Market", type: "Night market", schedule: "Mondays · 4:00 PM–10:00 PM", place: "Ruby St., Umali Subd., Batong Malake", description: "An evening market lead for food, drinks, and local finds near Los Baños’ community dining spots.", source: "https://www.facebook.com/elbicommunitymarket/" },
];


function useLandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
    const observer = reduceMotion ? null : new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer!.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });

    // Sections gated on async data (e.g. season, tours) mount after this effect's
    // initial querySelectorAll — watch for them so they aren't left at opacity:0 forever.
    const observe = (node: HTMLElement) => {
      if (reduceMotion) node.classList.add("is-visible");
      else observer!.observe(node);
    };
    document.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach(observe);

    const mutationObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(n => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches("[data-scroll-reveal]")) observe(n);
          n.querySelectorAll?.<HTMLElement>("[data-scroll-reveal]").forEach(observe);
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => { observer?.disconnect(); mutationObserver.disconnect(); };
  }, []);
}



const QUICK_LINKS = [
  { label: "Events", href: "/events", icon: CalendarDays, live: true },
  { label: "Delicacies", href: "/delicacies", icon: Utensils, live: true },
  { label: "Ride Guide", href: "/ride-guide", icon: Navigation, live: true },
  { label: "Parking", href: "/parking", icon: Car, live: true },
  { label: "Stay & Eat", href: "/stay-eat", icon: Utensils, live: true },
  { label: "Bus Tours", href: "/tours", icon: Ticket, live: true },
  { label: "Explore", href: "/explore", icon: Compass, live: true },
  { label: "Passport", href: "/passport", icon: Landmark, live: true },
];


export function Home() {
  useLandingMotion();
  const [email, setEmail] = useState("");
  const { data: events, error: eventsError } = useEvents();
  const { data: season, error: seasonError } = useCurrentSeason();
  const { data: tours, error: toursError } = useTours();
  const { data: destinations, error: destinationsError } = useDestinations();
  const happeningNow = (events ?? []).filter(e => e.status === "live" || e.status === "today").slice(0, 6);
  const featuredTours = (tours ?? []).slice(0, 4);
  const homeFeaturedDestinations = (destinations ?? []).filter(d => d.featured);
  return <><Header/><main className="landing-page elbiyahe-home">
    <section className="hero elbiyahe-hero-section" data-scroll-reveal>
      <img className="hero-image hero-scroll-image" src={IMG.hero} alt="Mt. Makiling, Los Baños"/>
      <div className="hero-overlay"/>
      <div className="hero-copy">
        <p className="eyebrow">LOS BAÑOS, LAGUNA</p><h1>What's happening in LB?<br/>Come Curious.</h1><div className="script">Los Baños is calling.</div><div className="accent-rule"/><p>Your field companion for discovering the many sides of Los Baños —<br/>events, places, flavors, and stories worth collecting.</p>
        <div className="hero-actions"><Button href="/events"><CalendarDays size={17}/> Explore Events</Button><Button href="/explore" variant="secondary"><Compass size={17}/> Discover LB</Button></div>
      </div>
    </section>

    {seasonError && (
    <section className="container scroll-reveal" data-scroll-reveal>
      <p className="muted">Couldn't load the current season — check your connection and try again.</p>
    </section>
    )}
    {season && (
    <section className="container elbiyahe-season-banner scroll-reveal" data-scroll-reveal>
      <div>
        <span className="eyebrow">{season.quarter} · {season.name.toUpperCase()}</span>
        <h2>{season.pillars}</h2>
        <p>Every season, Los Baños tells a different story. Right now it's {season.name} — running through {season.months}.</p>
      </div>
      <Button href="/events">See {season.name} events <ArrowRight size={15}/></Button>
    </section>
    )}

    <section className="container home-section scroll-reveal" data-scroll-reveal>
      <SectionTitle eyebrow="LIVE & TODAY" title="Happening Now" action={<Link href="/events" className="link-accent">All events <ChevronRight size={15}/></Link>}/>
      <div className="elbiyahe-happening-strip">
        {happeningNow.map(e => (
          <Link key={e.id} href={`/events/${e.slug}`} className="elbiyahe-happening-card">
            <img src={e.hero_image || IMG.hero} alt=""/>
            {e.status === "live" && <span className="elbiyahe-badge live">LIVE</span>}
            <div><b>{e.title}</b><small><CalendarDays size={12}/> {e.date_label} · {e.time_label}</small><small><MapPin size={12}/> {e.venue_name}</small></div>
          </Link>
        ))}
        {eventsError && <p className="muted" style={{ padding: "8px 0" }}>Couldn't load events right now — check your connection and try again.</p>}
        {!eventsError && happeningNow.length === 0 && <p className="muted" style={{ padding: "8px 0" }}>Nothing live right now — see all upcoming events.</p>}
      </div>
    </section>

    <section className="container home-section scroll-reveal" data-scroll-reveal>
      <SectionTitle title="Quick Discover"/>
      <div className="elbiyahe-quick-grid">
        {QUICK_LINKS.map(q => { const I = q.icon; return (
          <Link key={q.label} href={q.href} className="elbiyahe-quick-item">
            <span className="elbiyahe-quick-icon"><I size={22}/></span>
            <span>{q.label}</span>
            {!q.live && <small>soon</small>}
          </Link>
        ); })}
      </div>
    </section>

    <section className="container home-section scroll-reveal" data-scroll-reveal>
      <SectionTitle eyebrow="WORTH THE TRIP" title="Places to explore" action={<Link href="/explore" className="link-accent">⌖ View all places</Link>}/>
      {destinationsError ? (
        <p className="muted" style={{ padding: "8px 0" }}>Couldn't load places to explore right now — check your connection and try again.</p>
      ) : (
        <div className="destination-grid">{homeFeaturedDestinations.map((d,i)=><div className="scroll-stagger" data-stagger={i} key={d.id}><DestinationCard d={d}/></div>)}</div>
      )}
    </section>

    {toursError && (
    <section className="container home-section scroll-reveal" data-scroll-reveal>
      <SectionTitle title="Featured Bus Tours"/>
      <p className="muted">Couldn't load bus tours right now — check your connection and try again.</p>
    </section>
    )}
    {featuredTours.length > 0 && (
    <section className="container home-section scroll-reveal" data-scroll-reveal>
      <SectionTitle title="Featured Bus Tours" action={<Link href="/tours" className="link-accent">All packages <ChevronRight size={15}/></Link>}/>
      <p className="section-subtitle">Curated day trips with transport, stops, and a guide — for visitors coming from other cities.</p>
      <div className="bundle-rail">
        {featuredTours.map((t,i)=>(
          <div className="scroll-stagger" data-stagger={i} key={t.id}>
            <Link href={`/tours/${t.slug}`} className="elbiyahe-tour-card">
              <div className="elbiyahe-tour-card-media"><img src={t.hero_image || IMG.hero} alt={t.title}/>{t.featured && <span className="elbiyahe-badge ochre">FEATURED</span>}</div>
              <div className="elbiyahe-tour-card-body">
                <div className="elbiyahe-chip-row">{t.tags.map(tag=><span key={tag} className="tag">{tag}</span>)}</div>
                <h3>{t.title}</h3>
                <p className="muted"><Clock3 size={13}/> {t.duration} · {t.operator_name}</p>
                <div className="elbiyahe-tour-card-foot"><b>₱{t.price_per_seat.toLocaleString("en-PH")}<small> /seat</small></b><Rating value={t.rating} count={t.review_count}/></div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
    )}

    <section className="container stay-discovery scroll-reveal" data-scroll-reveal>
      <div className="stay-discovery-copy">
        <span className="eyebrow">STAY A LITTLE LONGER</span>
        <h2>Find a stay around Los Baños.</h2>
        <p>Browse live Airbnb homes in the Los Baños area, then check dates, amenities, prices, and host details directly on Airbnb.</p>
        <a className="btn primary" href={airbnbLosBanosUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/> View Airbnb stays</a>
        <small className="external-disclaimer">External search · availability and rates may change</small>
      </div>
      <div className="stay-discovery-note"><WalletCards size={22}/><b>Live search handoff</b><span>El-Biyahe! does not reproduce or estimate Airbnb availability, pricing, or ratings.</span></div>
    </section>

    <section className="container local-spots-section scroll-reveal" data-scroll-reveal>
      <SectionTitle eyebrow="EAT, BROWSE, STAY AWHILE" title="Local Spots Highlights" action={<span className="muted">Los Baños community finds</span>}/>
      <div className="local-spots-grid">{localSpots.map((spot,i)=><article className="local-spot-card scroll-stagger" data-stagger={i} key={spot.name}><div className={`local-spot-icon ${i===1?"night":""}`}>{i===1?<MoonStar size={21}/>:<Utensils size={21}/>}</div><div><span className="eyebrow">{spot.type}</span><h3>{spot.name}</h3><p className="local-spot-meta"><CalendarDays size={14}/>{spot.schedule}</p><p>{spot.description}</p><small><MapPin size={13}/>{spot.place}</small></div><a href={spot.source} target="_blank" rel="noreferrer" className="link-accent">Check current details <ExternalLink size={13}/></a></article>)}</div>
    </section>

    <section className="container explore-preview scroll-reveal" data-scroll-reveal>
      <div>
        <SectionTitle eyebrow="DISCOVER NEARBY" title="Explore Los Baños"/>
        <p>Nature, food, culture, and hidden gems around town<br/>on one interactive map.</p>
        <Button href="/explore"><Map size={17}/> Open the map</Button>
      </div>
      <div className="mini-map">
        <MapView points={destPoints(destinations).slice(0, 14)} interactive={false} fitBounds height={230} ariaLabel="Los Baños destinations map preview" />
      </div>
    </section>

    <section className="how-section scroll-reveal" data-scroll-reveal><div className="container"><SectionTitle title="The El-Biyahe! loop"/><div className="steps">{[["01","Discover","Find events, places, flavors, and stories across Los Baños.",Compass],["02","Go","Real jeep and tricycle routes, parking, and curated bus tours get you there.",Navigation],["03","Collect","Scan QR codes around town, fill your Digital LB Passport, and earn real rewards.",Landmark]].map(([n,t,c,I]:any)=><div className="step scroll-stagger" data-stagger={Number(n)} key={n}><div className="step-icon"><I size={26}/></div><span>{n}</span><h3>{t}</h3><p>{c}</p></div>)}</div></div></section>

    <section className="container elbiyahe-newsletter scroll-reveal" data-scroll-reveal>
      <div><span className="eyebrow">STAY IN THE LOOP</span><h2>Never miss what's happening in LB.</h2><p>Season announcements, new events, and Passport rewards — straight to your inbox.</p></div>
      <form onSubmit={e => { e.preventDefault(); if (email) { notify("You're subscribed. Come curious!"); setEmail(""); } }}>
        <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address"/>
        <Button type="submit">Subscribe</Button>
      </form>
    </section>
  </main><Footer/><BottomNav/></>
}
