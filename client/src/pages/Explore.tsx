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



export function Explore() {
  const { data: allDestinations, isLoading, error } = useDestinations();
  const [view, setView] = useState("map");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [tag, setTag] = useState("");
  const [price, setPrice] = useState(4);
  const [sort, setSort] = useState("Popular");
  const [showFilters, setShowFilters] = useState(false);
  const [visible, setVisible] = useState(4);
  const loc = useUserLocation();
  const categoryMap: any = { "Nature & Parks": "Nature", "Attractions": "Attractions", "Food & Restaurants": "Food", "Hotels & Stays": "Hotels", "Accommodations": "Hotels", "Guides & Tours": "Guides", "Culture & Heritage": "Culture", "Hidden Gems": "Hidden Gem" };
  const filtered = useMemo(() => {
    const list = (allDestinations ?? []).filter(d => {
      const matchQuery = `${d.name} ${d.place} ${d.type} ${d.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      const matchCategory = category === "All Categories" || (category === "Accommodations" ? d.type === "Hotels" && (d.place ?? "").includes("Los Baños") : d.type === categoryMap[category]);
      const matchTag = !tag || d.tags.includes(tag);
      return matchQuery && matchCategory && matchTag && d.price_tier <= price;
    });
    if (sort === "Nearby" && loc.coords) {
      return [...list].sort((a, b) => {
        const da = a.lat != null ? distanceKm(loc.coords!, { lat: a.lat, lng: a.lng! }) : Infinity;
        const dbb = b.lat != null ? distanceKm(loc.coords!, { lat: b.lat, lng: b.lng! }) : Infinity;
        return da - dbb;
      });
    }
    return [...list].sort((a, b) => sort === "Name" ? a.name.localeCompare(b.name) : Number(b.rating || 0) - Number(a.rating || 0));
  }, [allDestinations, query, category, tag, price, sort, loc.coords]);

  const isFiltering = query.trim() !== "" || category !== "All Categories" || tag !== "" || sort === "Nearby";
  const lbList = useMemo(() => filtered.filter(d => isLosBanos(d.lat, d.lng)), [filtered]);
  const nearbyList = useMemo(() => filtered.filter(d => !isLosBanos(d.lat, d.lng)), [filtered]);
  const ordered = useMemo(() => [...lbList, ...nearbyList], [lbList, nearbyList]);

  const nearMe = async () => {
    const pos = await loc.request();
    if (pos) { setSort("Nearby"); notify("Showing destinations nearest you."); }
    else notify("Location unavailable — showing all destinations.");
  };

  return <><Header/><main className="explore-page"><aside className={`filter-rail ${showFilters ? "open" : ""}`}><div className="rail-title"><h3>Categories</h3><ChevronDown size={15}/></div>{["All Categories", "Nature & Parks", "Attractions", "Food & Restaurants", "Hotels & Stays", "Accommodations", "Guides & Tours", "Culture & Heritage", "Hidden Gems"].map(x => <button className={category === x ? "selected" : ""} onClick={() => { setCategory(x); setShowFilters(false); }} key={x}><Compass size={16}/>{x}</button>)}<div className="rail-title spaced"><h3>Tags</h3><ChevronDown size={15}/></div><div className="tag-cloud">{["Family Friendly", "Adventure", "Budget Friendly", "Romantic", "Relaxation", "Waterfalls", "Scenic Views"].map(x => <button className={`tag ${tag === x ? "chosen" : ""}`} onClick={() => setTag(tag === x ? "" : x)} key={x}>{x}</button>)}</div><div className="rail-title spaced"><h3>Price Range</h3><ChevronDown size={15}/></div><input aria-label="Maximum price range" className="price-range" type="range" min="1" max="4" value={price} onChange={e => setPrice(Number(e.target.value))}/><div className="price-labels"><span>₱</span><span>₱₱</span><span>₱₱₱</span><span>₱₱₱₱</span></div></aside><section className="explore-content"><div className="page-heading"><div><h1>Explore Los Baños</h1><p>Los Baños first — plus the Laguna day trips nearby.</p></div><div className="search-row"><div className="searchbox"><Search size={18}/><input aria-label="Search destinations" placeholder="Search destinations, places, or activities..." value={query} onChange={e => setQuery(e.target.value)}/></div><Button variant="secondary" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={16}/> Filters</Button><div className="view-toggle">{[["map", Map], ["list", List], ["grid", Grid2X2]].map(([v, I]: any) => <button className={view === v ? "active" : ""} aria-pressed={view === v} aria-label={`Show ${v} view`} onClick={() => setView(v)} key={v}><I size={16}/><span>{v}</span></button>)}</div></div></div><div className="explore-quick-filters" aria-label="Browse destination categories">{["All Categories", "Nature & Parks", "Attractions", "Food & Restaurants", "Hotels & Stays", "Accommodations"].map(x => <button className={category === x ? "active" : ""} onClick={() => { setCategory(x); setVisible(4); setShowFilters(false); }} key={x}>{x}</button>)}</div>{isLoading && <Loading/>}{error && <LoadError message={(error as Error).message}/>}{!isLoading && !error && <div className={`explore-workspace ${view}`}><div className="result-list"><div className="result-count">{category === "Accommodations" ? `${filtered.length} Los Baños stays found` : `${filtered.length} destinations found`} <button onClick={() => setSort(sort === "Popular" ? "Name" : "Popular")}>Sort by: <b>{sort}</b>⌄</button></div>{category === "Accommodations" && <a className="airbnb-result-card" href={airbnbLosBanosUrl} target="_blank" rel="noreferrer"><div><span className="eyebrow">EXTERNAL SEARCH</span><h3>More homes around Los Baños</h3><p>Check live Airbnb availability, dates, prices, amenities, and host details on Airbnb.</p></div><ExternalLink size={17}/></a>}{(() => { const shown = ordered.slice(0, visible); const lb = shown.filter(d => isLosBanos(d.lat, d.lng)); const nb = shown.filter(d => !isLosBanos(d.lat, d.lng)); return <>{lb.length > 0 && <><h3 className="result-group-head">In Los Baños</h3>{lb.map(d => <DestinationCard d={d} compact key={d.id}/>)}</>}{nb.length > 0 && <><h3 className="result-group-head">Nearby Laguna day trips</h3>{nb.map(d => <DestinationCard d={d} compact key={d.id}/>)}</>}</>; })()}{visible < ordered.length && <Button variant="soft" onClick={() => setVisible(v => v + 3)}>Load more destinations <ChevronDown size={16}/></Button>}{filtered.length === 0 && <div className="empty-state"><Search size={25}/><h3>No spots found yet.</h3><p>Try a wider search or clear a filter.</p><Button variant="outline" onClick={() => { setQuery(""); setCategory("All Categories"); setTag(""); setPrice(4); }}>Clear filters</Button></div>}</div><div className="map-field"><MapView points={destPoints(filtered)} center={LB_CENTER} zoom={12.8} fitBounds={isFiltering} showUser={!!loc.coords} userCoords={loc.coords} height={540} ariaLabel="Map of Los Baños destinations"/><Button variant="map-button" onClick={nearMe}><Navigation size={15}/> {loc.status === "prompting" ? "Locating…" : "Show near me"}</Button><div className="explore-map-aside"><div className="map-legend-card"><h4>Map key</h4><ul><li><span className="dot" style={{background:"#0e543c"}}/> Nature &amp; parks</li><li><span className="dot" style={{background:"#94603c"}}/> Culture &amp; heritage</li><li><span className="dot" style={{background:"#d17b27"}}/> Food &amp; restaurants</li><li><span className="dot" style={{background:"#dba01c"}}/> Attractions</li><li><span className="dot" style={{background:"#377b8c"}}/> Hotels &amp; stays</li></ul></div><Link href="/heritage-walk" className="heritage-callout-card"><Landmark size={20}/><div><b>Los Baños Heritage Walk</b><small>17 historic stops · self-guided · from the parish to the hot springs</small><span className="link-accent">Open the walk <ArrowRight size={13}/></span></div></Link></div></div></div>}</section></main><BottomNav/></>;
}
