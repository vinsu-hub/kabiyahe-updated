import "@/styles/pages/explore.css";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Camera, Coffee, Compass, ExternalLink, Grid2X2, Landmark, Leaf, List, Navigation, Search, SlidersHorizontal, Utensils } from "lucide-react";
import { useDestinations } from "@/lib/supabase/queries";
import type { DestinationRow } from "@/lib/supabase/types";
import { MapView, type LBPoint } from "@/components/MapView";
import { distanceKm, LB_CENTER, useUserLocation } from "@/lib/geo";
import { Header, Footer, BottomNav, RightRailCard, PassportPromoCard, ListingCard, Button, notify } from "@/components/shell";
import { Loading, LoadError } from "@/pages/ElbiyaheFeatures";
import { conceptImages } from "@/lib/conceptImages";

const groups = [
  { label: "All", type: "", icon: Grid2X2, image: conceptImages.exploreMountMakiling.src },
  { label: "Nature", type: "Nature", icon: Leaf, image: conceptImages.exploreHiddenFalls.src },
  { label: "Food", type: "Food", icon: Utensils, image: conceptImages.foodBukoPie.src },
  { label: "Culture", type: "Culture", icon: Landmark, image: conceptImages.exploreUplbMuseum.src },
  { label: "Photo Spots", type: "Attractions", icon: Camera, image: conceptImages.exploreMakilingViewDeck.src },
  { label: "Landmarks", type: "Attractions", icon: Landmark, image: conceptImages.exploreBakerHall.src },
  { label: "Hotels & Stays", type: "Hotels", icon: Coffee, image: conceptImages.stayEatHotelExterior.src },
  { label: "Guides & Tours", type: "Guides", icon: Compass, image: conceptImages.toursHeritageChurch.src },
  { label: "Hidden Gems", type: "Hidden Gem", icon: Leaf, image: conceptImages.exploreHiddenFalls.src },
  { label: "Hangouts", type: "Relaxation", icon: Coffee, image: conceptImages.exploreFreedomPark.src },
] as const;

function destinationImage(d: DestinationRow) {
  const name = d.name.toLowerCase();
  if (name.includes("baker")) return conceptImages.exploreBakerHall.src;
  if (name.includes("freedom")) return conceptImages.exploreFreedomPark.src;
  if (name.includes("japanese")) return conceptImages.exploreJapaneseGarden.src;
  if (name.includes("museum")) return conceptImages.exploreUplbMuseum.src;
  if (name.includes("buko")) return conceptImages.foodBukoPie.src;
  if (name.includes("falls")) return conceptImages.exploreHiddenFalls.src;
  if (name.includes("makiling")) return conceptImages.exploreMakilingViewDeck.src;
  if (name.includes("food") || d.type === "Food") return conceptImages.exploreNightFoodMarket.src;
  if (d.type === "Culture") return conceptImages.exploreUplbLandmark.src;
  if (d.type === "Nature") return conceptImages.exploreMountMakiling.src;
  return conceptImages.exploreFreedomPark.src;
}

const points = (rows: DestinationRow[]): LBPoint[] => rows.filter(d => d.lat != null && d.lng != null).map(d => ({ id: d.id, lat: d.lat!, lng: d.lng!, name: d.name, kind: d.type, href: `/explore/${d.slug}`, sub: d.place ?? undefined }));

export function Explore() {
  const { data: allDestinations, isLoading, error } = useDestinations();
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [view, setView] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [visible, setVisible] = useState(5);
  const [tag, setTag] = useState("");
  const [price, setPrice] = useState(4);
  const [sort, setSort] = useState<"Popular" | "Name" | "Nearby">("Popular");
  const [showFilters, setShowFilters] = useState(false);
  const loc = useUserLocation();
  const filtered = useMemo(() => (allDestinations ?? []).filter(d =>
    !d.placeholder && (!category || (category === "Accommodations" ? d.type === "Hotels" && (d.place ?? "").includes("Los Baños") : d.type === category)) && (!tag || d.tags.includes(tag)) && d.price_tier <= price && `${d.name} ${d.place ?? ""} ${d.type} ${d.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => sort === "Name" ? a.name.localeCompare(b.name) : sort === "Nearby" && loc.coords ? (a.lat != null && a.lng != null ? distanceKm(loc.coords,{lat:a.lat,lng:a.lng}) : Infinity) - (b.lat != null && b.lng != null ? distanceKm(loc.coords,{lat:b.lat,lng:b.lng}) : Infinity) : Number(b.featured) - Number(a.featured) || (b.rating ?? 0) - (a.rating ?? 0)), [allDestinations, category, query, tag, price, sort, loc.coords]);
  const popular = useMemo(() => [...(allDestinations ?? [])].filter(d => !d.placeholder && d.rating != null && (d.review_count ?? 0) > 0).sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0,5), [allDestinations]);
  const choose = (type: string) => { setCategory(type); setVisible(5); };
  const nearMe = async () => { const pos = await loc.request(); if (pos) setSort("Nearby"); notify(pos ? "Showing destinations nearest you." : "Location unavailable — showing all destinations."); };
  return <><Header /><main className="explore-v2">
    <div className="explore-v2-layout">
      <div className="explore-v2-main">
        <div className="explore-v2-lead">
          <div className="explore-v2-intro"><h1>Explore LB</h1><p className="script-accent">Discover places, stories, and hidden gems around Los Baños.</p></div>
          <label className="explore-v2-search"><input aria-label="Search places and attractions" placeholder="Search places, attractions, or keywords..." value={query} onChange={e => setQuery(e.target.value)} /><Search size={21}/></label>
          <button className="explore-v2-filter-toggle" onClick={() => setShowFilters(v => !v)}><SlidersHorizontal size={14}/> Filters</button>
          {showFilters && <div className="explore-v2-extra-filters"><label>Category <select value={category} onChange={e => choose(e.target.value)}><option value="">All categories</option>{groups.filter(g => g.type).map(g => <option key={g.label} value={g.type}>{g.label}</option>)}<option value="Accommodations">Los Baños accommodations</option></select></label><label>Tag <select value={tag} onChange={e => setTag(e.target.value)}><option value="">All tags</option>{Array.from(new Set((allDestinations ?? []).flatMap(d => d.tags))).sort().map(t => <option key={t}>{t}</option>)}</select></label><label>Max. price <input type="range" min="1" max="4" value={price} onChange={e => setPrice(Number(e.target.value))}/> {"₱".repeat(price)}</label><label>Sort <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option>Popular</option><option>Name</option>{loc.coords && <option>Nearby</option>}</select></label><a href="https://www.airbnb.com/s/Los-Banos--Laguna--Philippines/homes" target="_blank" rel="noreferrer">Find Los Baños stays on Airbnb <ExternalLink size={13}/></a></div>}
          <div className="explore-v2-chips" role="group" aria-label="Browse categories">{groups.filter(g => !["Hotels", "Guides", "Hidden Gem"].includes(g.type)).map(g => <button key={g.label} className={category === g.type ? "active" : ""} onClick={() => choose(g.type)}><g.icon size={22}/><span>{g.label}</span></button>)}</div>
        </div>
        <section className="explore-v2-map"><MapView points={points(filtered)} center={LB_CENTER} zoom={12.8} fitBounds={!!query || !!category} showUser={!!loc.coords} userCoords={loc.coords} height={350} ariaLabel="Map of Los Baños destinations"/><button className="explore-v2-map-switch" onClick={() => setView(view === "map" ? "list" : "map")}>{view === "map" ? <List size={16}/> : <Compass size={16}/>} View as {view === "map" ? "List" : "Map"}</button><button className="explore-v2-near" onClick={nearMe} aria-label="Show my location"><Navigation size={19}/></button></section>
        {view === "list" && <div className="explore-v2-map-list">{filtered.slice(0,8).map(d => <Link key={d.id} href={`/explore/${d.slug}`}>{d.name}<ArrowRight size={15}/></Link>)}</div>}
        <section className="explore-v2-heritage" aria-labelledby="explore-heritage-title"><img src={conceptImages.toursHeritageChurch.src} alt=""/><div><span className="eyebrow">SELF-GUIDED · ON FOOT</span><h2 id="explore-heritage-title">Los Baños Heritage Walk: 17 stops</h2><p>Follow the town’s stories from the parish to the hot springs, with a map and directions along the way.</p><Button href="/heritage-walk">Open the walk <ArrowRight size={16}/></Button></div></section>
        <section className="explore-v2-categories"><div className="explore-v2-section-head"><h2>Explore by Category</h2><button onClick={() => choose("")}>See all categories <ArrowRight size={16}/></button></div><div className="explore-v2-category-grid">{groups.slice(1,6).map(g => { const count = (allDestinations ?? []).filter(d => !d.placeholder && d.type === g.type).length; return <button key={g.label} onClick={() => choose(g.type)} style={{ backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.76),transparent 67%),url(${g.image})` }}><g.icon size={23}/><strong>{g.label}</strong><span>{isLoading ? "Loading…" : `${count} ${count === 1 ? "place" : "places"}`}</span></button>; })}</div></section>
        <section className="explore-v2-discover"><div className="explore-v2-section-head"><div><h2>Discover LB</h2><p>Handpicked spots to explore around Los Baños.</p></div></div>{isLoading && <Loading/>}{error && <LoadError message={(error as Error).message}/>} {!isLoading && !error && (filtered.length ? <><div className="explore-v2-card-grid">{filtered.slice(0,visible).map(d => <ListingCard key={d.id} title={d.name} href={`/explore/${d.slug}`} image={destinationImage(d)} saved={saved.has(d.id)} onSave={() => { setSaved(current => { const next = new Set(current); if (next.has(d.id)) next.delete(d.id); else next.add(d.id); return next; }); notify(saved.has(d.id) ? "Removed from saved" : "Saved for later"); }} badge={d.featured ? "Featured" : undefined} meta={<>{d.type} · {d.place ?? "Los Baños"}</>} rating={d.rating} distance={loc.coords && d.lat != null && d.lng != null ? `${distanceKm(loc.coords,{lat:d.lat,lng:d.lng}).toFixed(1)} km` : undefined}/>)}</div>{visible < filtered.length && <button className="explore-v2-more" onClick={() => setVisible(v => v + 5)}>View more places</button>}</> : <div className="explore-v2-empty">No places match this search. Try another term or category.<Button variant="outline" onClick={() => { setQuery(""); choose(""); setTag(""); setPrice(4); }}>Clear filters</Button></div>)}</section>
      </div>
      <aside className="explore-v2-rail"><RightRailCard title="Popular Near You" seeAllHref="/explore">{isLoading ? <p className="explore-v2-rail-empty">Loading places…</p> : popular.length ? popular.map(d => <Link className="explore-v2-popular" href={`/explore/${d.slug}`} key={d.id}><img src={destinationImage(d)} alt=""/><span><strong>{d.name}</strong><small>{d.type}</small><small className="explore-v2-rating">★ {d.rating?.toFixed(1)} ({d.review_count})</small></span></Link>) : <p className="explore-v2-rail-empty">Rated places will appear here as reviews come in.</p>}</RightRailCard><PassportPromoCard body="Visit places around LB and collect Passport stamps to earn rewards."/></aside>
    </div>
  </main><Footer/><BottomNav/></>;
}
