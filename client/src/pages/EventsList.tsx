import { DataUnavailable } from "@/components/shell/DataUnavailable";
import "@/styles/pages/events.css";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Bookmark, CalendarDays, ChevronLeft, ChevronRight, List, MapPin, Search, SlidersHorizontal, Users } from "lucide-react";
import { useCurrentSeason, useEvents, useSeasons } from "@/lib/supabase/queries";
import type { EventRow } from "@/lib/supabase/types";
import { MapView } from "@/components/MapView";
import { FilterSidebar, RightRailCard } from "@/components/shell";
import { conceptImages } from "@/lib/conceptImages";
import { prefersReducedMotion } from "@/lib/geo";

interface Shell { Header: React.ComponentType; BottomNav: React.ComponentType; Footer: React.ComponentType; Button: React.ComponentType<any>; Tag: React.ComponentType<any> }
const notify = (message: string) => window.dispatchEvent(new CustomEvent("elbiyahe:notice", { detail: message }));
export function Loading() { return <div className="elbiyahe-loading" role="status">Loading…</div>; }
export function LoadError({ message }: { message?: string }) { return <div className="empty-state"><h3>Couldn't load this yet.</h3><p>{message || "Check your connection and try again."}</p></div>; }
const DATE_FILTERS = ["all", "today", "week", "month", "custom"] as const;
const DATE_LABELS = { all: "All Dates", today: "Today", week: "This Week", month: "This Month", custom: "Custom Range" };
const CATEGORIES = ["Culture", "Sports", "Arts", "Community", "Food", "Education", "Environment", "Faith"];
const imageFor = (e: EventRow) => {
  const s = `${e.slug} ${e.title} ${e.category}`.toLowerCase();
  if (/basket|sport/.test(s)) return conceptImages.eventsBasketballFinals.src;
  if (/food|festival/.test(s) && /food/.test(s)) return conceptImages.eventsFoodFestival.src;
  if (/choir|concert/.test(s)) return conceptImages.eventsUplbChoir.src;
  if (/run|trail/.test(s)) return conceptImages.eventsMakilingTrailRun.src;
  if (/music|street/.test(s)) return conceptImages.eventsLiveMusicStage.src;
  return conceptImages.eventsCulturalDance.src;
};
function EventCard({ e }: { e: EventRow }) {
  const [saved, setSaved] = useState(false);
  return <article className="events-result-card">
    <Link href={`/events/${e.slug}`} className="events-result-image"><img src={imageFor(e)} alt={e.title} />{e.status === "live" && <span className="events-live">LIVE</span>}</Link>
    <div className="events-result-copy"><div className="events-result-title"><Link href={`/events/${e.slug}`}><h3>{e.title}</h3></Link><button aria-label={saved ? "Remove bookmark" : "Bookmark event"} onClick={() => { setSaved(!saved); notify(saved ? "Removed from saved" : "Event bookmarked."); }}><Bookmark size={19} fill={saved ? "currentColor" : "none"}/></button></div>
      <div className="events-result-tags"><span>{e.category}</span>{e.status !== "anytime" && <span>{e.status === "live" ? "Live now" : e.status === "recap" ? "Recap" : "Event"}</span>}</div>
      <div className="events-result-meta"><span><CalendarDays size={14}/>{e.date_label} · {e.time_label}</span><span><MapPin size={14}/>{e.venue_name}</span></div>
      {e.description && <p>{e.description}</p>}
      <div className="events-result-bottom">{e.attendee_count > 0 && <span><Users size={14}/>{e.attendee_count.toLocaleString()} going</span>}<Link href={`/events/${e.slug}`} className="events-green-button">View Details</Link></div>
    </div>
  </article>;
}
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
function EventCalendar({ events }: { events: EventRow[] }) {
  const [month, setMonth] = useState(() => new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const cells = Array.from({ length: first.getDay() + new Date(month.getFullYear(), month.getMonth()+1, 0).getDate() }, (_, i) => i - first.getDay() + 1);
  const eventDays = new Set(events.filter(e => e.starts_at && new Date(e.starts_at).getMonth() === month.getMonth() && new Date(e.starts_at).getFullYear() === month.getFullYear()).map(e => new Date(e.starts_at!).getDate()));
  return <RightRailCard title="Event Calendar" className="events-calendar"><div className="events-calendar-head"><strong>{month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</strong><div><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))}><ChevronLeft size={16}/></button><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))}><ChevronRight size={16}/></button></div></div><div className="events-calendar-grid">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d=><b key={d}>{d}</b>)}{cells.map((d,i)=><span key={i} className={`${d > 0 && eventDays.has(d) ? "has-event" : ""} ${d > 0 && new Date().getDate() === d && new Date().getMonth() === month.getMonth() && new Date().getFullYear() === month.getFullYear() ? "today" : ""}`}>{d > 0 ? d : ""}</span>)}</div></RightRailCard>;
}
export function EventsList({ Header, BottomNav, Footer, Button }: Shell) {
  const { data: events, isLoading, error, refetch } = useEvents();
  const { data: seasons } = useSeasons();
  const { data: currentSeason } = useCurrentSeason();
  const [categories, setCategories] = useState<string[]>([]);
  const [view, setView] = useState<"list"|"map">("list");
  const [season, setSeason] = useState("all");
  const [location, setLocation] = useState("all");
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]>("all");
  const [customFrom, setCustomFrom] = useState(""); const [customTo, setCustomTo] = useState("");
  const [query, setQuery] = useState(""); const [sort, setSort] = useState<"soonest"|"popular">("soonest");
  const [showFilters, setShowFilters] = useState(false);
  const locations = useMemo(() => Array.from(new Set((events ?? []).map(e => e.barangay).filter((b): b is string => !!b))).sort(), [events]);
  const dateRange = useMemo(() => { const today = startOfDay(new Date()); if (dateFilter === "today") return [today, addDays(today,1)] as const; if (dateFilter === "week") return [today,addDays(today,7)] as const; if (dateFilter === "month") return [today,new Date(today.getFullYear(),today.getMonth()+1,1)] as const; if (dateFilter === "custom" && customFrom && customTo) return [new Date(customFrom),addDays(new Date(customTo),1)] as const; return null; }, [dateFilter,customFrom,customTo]);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return [...(events ?? []).filter(e => { if (categories.length && !categories.includes(e.category)) return false; if (season !== "all" && e.season_key !== season) return false; if (location !== "all" && e.barangay !== location) return false; if (q && !`${e.title} ${e.venue_name ?? ""} ${e.description ?? ""}`.toLowerCase().includes(q)) return false; if (dateRange) { if (!e.starts_at) return false; const start = new Date(e.starts_at); const end = e.ends_at ? new Date(e.ends_at) : start; if (end < dateRange[0] || start >= dateRange[1]) return false; } return true; })].sort((a,b) => sort === "popular" ? b.attendee_count - a.attendee_count : (a.starts_at ? new Date(a.starts_at).getTime() : Infinity) - (b.starts_at ? new Date(b.starts_at).getTime() : Infinity)); }, [events,categories,season,location,query,sort,dateRange]);
  const resetFilters = () => { setCategories([]); setSeason("all"); setLocation("all"); setDateFilter("all"); setCustomFrom(""); setCustomTo(""); setQuery(""); };
  const seeSeasonDetails = () => { const current = (seasons ?? []).find(s => s.is_current); if (current) setSeason(current.key); document.getElementById("events-results")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" }); };
  const featured = (events ?? []).find(e => e.featured) ?? (events ?? []).find(e => e.status === "live" || e.status === "today");
  return <><Header/><main className="container elbiyahe-events-page"><section className="events-hero"><div className="events-hero-copy"><h1>Events</h1><p className="script-accent">Join what moves LB!</p><p>From culture and sports to arts and community celebrations—discover events happening around Los Baños, Laguna.</p></div><div className="events-hero-photo"><img src={conceptImages.eventsHero.src} alt={conceptImages.eventsHero.alt}/></div><div className="events-season">{currentSeason ? <><small>THIS SEASON</small><h2>{currentSeason.quarter} <span>{currentSeason.name.replace(/^El-Biyahe!\s*/, "")}</span></h2><p>{currentSeason.blurb}</p><button onClick={seeSeasonDetails}>See season details <ArrowRight size={15}/></button></> : <><small>COME CURIOUS</small><h2>Find your next event</h2><p>Explore what's happening around Los Baños.</p></>}</div></section>
    <div className="events-layout"><FilterSidebar title="Filter Events" className={`events-filter ${showFilters ? "open" : ""}`}><button className="events-reset" onClick={resetFilters}>Reset</button><label className="events-search"><input aria-label="Search events" placeholder="Search events..." value={query} onChange={ev=>setQuery(ev.target.value)}/><Search size={17}/></label><fieldset><legend>Date</legend>{DATE_FILTERS.map(d=><label key={d}><input type="radio" name="date-filter" checked={dateFilter===d} onChange={()=>setDateFilter(d)}/>{DATE_LABELS[d]}</label>)}{dateFilter === "custom" && <div className="events-date-range"><input type="date" aria-label="From date" value={customFrom} onChange={ev=>setCustomFrom(ev.target.value)}/><input type="date" aria-label="To date" value={customTo} onChange={ev=>setCustomTo(ev.target.value)}/></div>}</fieldset><fieldset><legend>Category</legend><label><input type="checkbox" checked={categories.length===0} onChange={()=>setCategories([])}/>All Categories</label>{CATEGORIES.map(c=><label key={c}><input type="checkbox" checked={categories.includes(c)} onChange={()=>setCategories(v=>v.includes(c)?v.filter(x=>x!==c):[...v,c])}/>{c}</label>)}</fieldset><fieldset><legend>Season</legend><select aria-label="Season" value={season} onChange={ev=>setSeason(ev.target.value)}><option value="all">All seasons</option>{(seasons??[]).map(s=><option key={s.key} value={s.key}>{s.quarter} · {s.name.replace(/^El-Biyahe!\s*/, "")}</option>)}</select></fieldset><fieldset><legend>Location</legend><select aria-label="Location" value={location} onChange={ev=>setLocation(ev.target.value)}><option value="all">All Locations</option>{locations.map(b=><option key={b} value={b}>{b}</option>)}</select></fieldset><Button onClick={()=>setShowFilters(false)}>Apply Filters</Button></FilterSidebar>
    <section className="events-main" id="events-results"><div className="events-main-head"><strong>{error ? "Events unavailable" : isLoading ? "Finding events…" : `${filtered.length} event${filtered.length===1?"":"s"} found`}</strong><div className="events-main-controls"><button className="events-filter-toggle" onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={15}/> Filters</button><label>Sort by: <select value={sort} onChange={ev=>setSort(ev.target.value as typeof sort)}><option value="soonest">Soonest</option><option value="popular">Most popular</option></select></label><div className="events-view"><button className={view==="list"?"active":""} onClick={()=>setView("list")}><List size={15}/> List</button><button className={view==="map"?"active":""} onClick={()=>setView("map")}><MapPin size={15}/> Map</button></div></div></div>{isLoading && <Loading/>}{error && <DataUnavailable onRetry={refetch} />} {!isLoading && !error && (view==="map" ? <MapView points={filtered.filter(e=>e.lat!=null&&e.lng!=null).map(e=>({id:e.id,lat:e.lat!,lng:e.lng!,name:e.title,kind:e.category,href:`/events/${e.slug}`,sub:e.date_label??undefined}))} fitBounds height={480} ariaLabel="Map of Los Baños events"/> : <div className="events-result-list">{filtered.map(e=><EventCard key={e.id} e={e}/>)}</div>)}{!isLoading&&!error&&filtered.length===0&&<div className="empty-state"><CalendarDays size={26}/><h3>No events match those filters.</h3><p>Try a different category, date, or location.</p><Button variant="outline" onClick={resetFilters}>Clear filters</Button></div>}</section>
    <aside className="events-right-rail">{featured && <RightRailCard title="Featured Event" className="events-featured"><Link href={`/events/${featured.slug}`}><img src={imageFor(featured)} alt={featured.title}/></Link><h3>{featured.title}</h3><span className="events-featured-category">{featured.category}</span><p><CalendarDays size={14}/>{featured.date_label} · {featured.time_label}</p><p><MapPin size={14}/>{featured.venue_name}</p>{featured.attendee_count > 0 && <p><Users size={14}/>{featured.attendee_count.toLocaleString()} going</p>}<Link className="events-green-button" href={`/events/${featured.slug}`}>View Details</Link></RightRailCard>}<div className="events-newsletter"><h3>Never miss what's happening in LB!</h3><p>Get updates on events and local spots.</p><input type="email" aria-label="Newsletter email" placeholder="Newsletter signups coming soon" disabled/><span>Subscriptions will open soon.</span><div className="events-newsletter-art" aria-hidden="true">✦</div></div>{!isLoading&&!error&&<EventCalendar events={events??[]}/>}</aside></div></main><Footer/><BottomNav/></>;
}
