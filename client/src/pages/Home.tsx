import { DataUnavailable } from "@/components/shell/DataUnavailable";
import { useState, type ReactElement } from "react";
import { Link } from "wouter";
import { ArrowRight, Bus, CalendarDays, MapPin, Ticket, Utensils, BedDouble, MapPinned, Car } from "lucide-react";
import { useCurrentSeason, useDestinations, useEvents, useSeasons, useTours } from "@/lib/supabase/queries";
import { Header, Footer, BottomNav, Button, PageHero, PassportPromoCard, StatTile, SkylineBand, notify } from "@/components/shell";
import { conceptImages } from "@/lib/conceptImages";
import "@/styles/pages/home.css";

const seasonArt = ["homeHeroCollage", "eventsBasketballFinals", "exploreMakilingViewDeck", "eventsStreetFestivalHero"] as const;
const eventImage = (title: string, category: string) => {
  const name = title.toLowerCase();
  if (name.includes("basketball")) return conceptImages.eventsBasketballFinals.src;
  if (name.includes("choir")) return conceptImages.eventsUplbChoir.src;
  if (name.includes("food")) return conceptImages.eventsFoodFestival.src;
  if (name.includes("run")) return conceptImages.eventsMakilingTrailRun.src;
  if (category === "Arts") return conceptImages.eventsCulturalDance.src;
  return conceptImages.eventsStreetFestivalHero.src;
};
const quickLinks = [
  { label: "Events", href: "/events", icon: CalendarDays }, { label: "Explore", href: "/explore", icon: MapPinned },
  { label: "Delicacies", href: "/delicacies", icon: Utensils }, { label: "Ride Guide", href: "/ride-guide", icon: Bus },
  { label: "Stay & Eat", href: "/stay-eat", icon: BedDouble }, { label: "Plan Your Day", href: "/plan", icon: CalendarDays },
  { label: "Passport", href: "/passport", icon: Ticket },
  { label: "Parking", href: "/parking", icon: Car },
  { label: "Bus Tours", href: "/tours", icon: Bus },
];

export function Home() {
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [email, setEmail] = useState("");
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasons, error: seasonsError, refetch: retrySeasons } = useSeasons();
  const { data: events, error: eventsError, refetch: retryEvents } = useEvents();
  const { data: destinations, error: destinationsError } = useDestinations();
  const { data: tours } = useTours();
  const happening = (events ?? []).filter(e => e.status === "live" || e.status === "today").slice(0, 5);
  const spotlight = seasons?.[seasonIndex] ?? currentSeason;
  const metrics = [
    events?.length ? { label: "Events listed", value: events.length, icon: <CalendarDays /> } : null,
    destinations?.length ? { label: "Places to explore", value: destinations.length, icon: <MapPin /> } : null,
    tours?.length ? { label: "Bus tours", value: tours.length, icon: <Bus /> } : null,
  ].filter((m): m is { label: string; value: number; icon: ReactElement } => Boolean(m));
  return <><Header /><main className="home-page">
    <div className="home-wrap home-hero-wrap"><PageHero className="home-hero" title="Explore Los Baños." subtitle="Come Curious." body="Your go-to guide for events, food, transport, places to stay, and everything worth discovering in Los Baños, Laguna." image={conceptImages.homeHeroCollage.src} imageAlt={conceptImages.homeHeroCollage.alt} actions={<><Button href="/events">Explore Events <ArrowRight size={17}/></Button><Button href="/explore" variant="secondary">Discover LB</Button></>} rightCard={<div className="home-season-card"><small>THIS SEASON</small>{spotlight ? <><strong>{spotlight.quarter}</strong><h2>{spotlight.name}</h2><p>{spotlight.blurb || spotlight.pillars}</p></> : <><h2>Discover Los Baños</h2><p>Explore the events and places that make every visit different.</p></>}<Link href="/events">See what's on <ArrowRight size={16}/></Link>{seasons && seasons.length > 1 && <div className="home-season-dots" aria-label="Choose season">{seasons.map((s,i) => <button key={s.key} type="button" aria-label={`Show ${s.name}`} aria-pressed={i === seasonIndex} onClick={() => setSeasonIndex(i)} />)}</div>}</div>} /></div>
    <div className="home-wrap"><section className="home-panel home-seasons"><div className="home-section-head"><h2>The Four Seasons of Elbi</h2><Link href="/events">View calendar <ArrowRight size={15}/></Link></div>{seasonsError ? <DataUnavailable onRetry={retrySeasons}/> : seasons?.length ? <div className="home-season-grid">{seasons.slice(0,4).map((season,i) => <Link href="/events" className={`home-quarter home-quarter-${i+1}`} key={season.key}><img src={conceptImages[seasonArt[i]].src} alt=""/><div><b>{season.quarter}</b><h3>{season.name}</h3><span>{season.months}</span><p>{season.blurb || season.pillars}</p></div></Link>)}</div> : <div className="home-season-grid">{seasonArt.map((key,i) => <Link href="/events" className={`home-quarter home-quarter-${i+1}`} key={key}><img src={conceptImages[key].src} alt=""/><div><b>Q{i+1}</b><h3>Explore the season</h3><p>See events and discoveries</p></div></Link>)}</div>}</section>
    <section className="home-panel home-happening"><div className="home-section-head"><h2><span className="home-live-dot"/>Happening Now</h2><Link href="/events">See all events <ArrowRight size={15}/></Link></div>{eventsError ? <DataUnavailable onRetry={retryEvents}/> : happening.length ? <div className="home-event-rail">{happening.map(e => <Link href={`/events/${e.slug}`} className="home-event" key={e.id}><div className="home-event-image"><img src={eventImage(e.title, e.category)} alt=""/>{e.status === "live" && <span>LIVE</span>}</div><div className="home-event-body"><h3>{e.title}</h3><small>{e.category}</small><small><CalendarDays size={13}/>{e.date_label || "Date to be announced"}{e.time_label ? ` · ${e.time_label}` : ""}</small><small><MapPin size={13}/>{e.venue_name || "Los Baños"}</small>{e.attendee_count > 0 && <b>{e.attendee_count} going</b>}</div></Link>)}</div> : <p className="home-empty">Nothing is live right now. Browse upcoming events.</p>}</section>
    <section className="home-panel home-needs"><div className="home-section-head"><h2>What do you need?</h2></div><div className="home-quick-grid">{quickLinks.map(({label,href,icon:Icon}) => <Link href={href} key={href}><span><Icon size={26}/></span><b>{label}</b></Link>)}</div></section>
    <section className="home-discover"><div className="home-discover-intro"><h2>Explore. Join. Experience.</h2><p>From hidden spots to local favorites, everything in LB is waiting for you.</p><p>For the community. For visitors. For local businesses.</p><Button href="/explore" variant="secondary">Start Exploring <ArrowRight size={16}/></Button></div><div className="home-discover-cards">{[{title:"Explore LB",href:"/explore",image:conceptImages.homeForestFalls.src,description:"Find places, attractions, and local favorites."},{title:"Plan Your Day",href:"/plan",image:conceptImages.planHero.src,description:"Build your own itinerary."},{title:"Stay & Eat",href:"/stay-eat",image:conceptImages.stayEatHero.src,description:"Find spots to eat and stay."}].map(card => <Link href={card.href} key={card.href}><img src={card.image} alt=""/><b>{card.title}</b><small>{card.description}</small></Link>)}</div><PassportPromoCard body="Scan, collect, and discover more with your Digital LB Passport." illustration={<Ticket size={50}/>}/></section>
    {metrics.length > 0 && <section className="home-stats" aria-label="El-Biyahe listings">{metrics.map(m => <StatTile key={m.label} {...m}/>)}</section>}
    <section className="home-newsletter"><div><p className="script-accent">Come Curious.</p><h2>Stay in the know!</h2><p>Find events and local discoveries across Los Baños.</p></div><form onSubmit={e => { e.preventDefault(); if (email) { notify("Newsletter signup is not available yet. Explore our latest events instead."); setEmail(""); } }}><label htmlFor="home-email">Email address</label><input id="home-email" type="email" required placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}/><button type="submit">Subscribe</button></form><SkylineBand/></section>
    </div>
  </main><Footer/><BottomNav/></>;
}
