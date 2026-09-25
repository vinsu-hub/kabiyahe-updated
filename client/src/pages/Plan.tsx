import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, Car, Clock3, GripVertical, Lightbulb, List, Map, MapPin, Plus, Trash2, Footprints, Bus, Route, Flag, Users, Compass } from "lucide-react";
import { BottomNav, Button, ChipGroup, CommunityStrip, Footer, Header, PageHero, RightRailCard, SkylineBand, notify } from "@/components/shell";
import { MapView, type LBPoint } from "@/components/MapView";
import { conceptImages } from "@/lib/conceptImages";
import { distanceKm } from "@/lib/geo";
import { useDestinations } from "@/lib/supabase/queries";
import type { DestinationRow } from "@/lib/supabase/types";
import "@/styles/pages/plan.css";

const storageKey = "elbiyahe-day-plan-v1";
const imageFor = (d: DestinationRow) => {
  const name = d.name.toLowerCase();
  if (name.includes("baker")) return conceptImages.exploreBakerHall.src;
  if (name.includes("fall")) return conceptImages.exploreHiddenFalls.src;
  if (name.includes("garden")) return conceptImages.exploreJapaneseGarden.src;
  if (name.includes("makiling")) return conceptImages.exploreMountMakiling.src;
  if (name.includes("museum")) return conceptImages.exploreUplbMuseum.src;
  if (name.includes("park")) return conceptImages.exploreFreedomPark.src;
  if (name.includes("pie")) return conceptImages.foodBukoPie.src;
  if (d.type === "Food") return conceptImages.foodBreakfast.src;
  if (d.type === "Culture") return conceptImages.exploreUplbLandmark.src;
  if (d.type === "Nature") return conceptImages.homeForestFalls.src;
  return conceptImages.exploreMakilingViewDeck.src;
};
const readSaved = (): string[] => { try { const value = JSON.parse(localStorage.getItem(storageKey) || "[]"); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []; } catch { return []; } };
const today = () => new Date().toLocaleDateString("en-CA");
const suggestionTypes = ["Quick Trip", "Nature Lovers", "Food Trip", "Family Day"] as const;
type SuggestionType = typeof suggestionTypes[number];

export function PlanPage() {
  const { data: destinations, error, isLoading } = useDestinations();
  const [stopIds, setStopIds] = useState<string[]>(readSaved);
  const [initialized, setInitialized] = useState(false);
  const [start, setStart] = useState("UPLB Main Gate");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [mode, setMode] = useState("Private car");
  const [view, setView] = useState<"map" | "list">("map");
  const [suggestion, setSuggestion] = useState<SuggestionType>("Quick Trip");
  const [dragged, setDragged] = useState<number | null>(null);
  const [addId, setAddId] = useState("");
  useEffect(() => { if (destinations && !initialized) { const valid = stopIds.filter(id => destinations.some(d => d.id === id)); setStopIds(valid.length ? valid : destinations.filter(d => !d.placeholder && d.lat != null && d.lng != null).slice(0, 6).map(d => d.id)); setInitialized(true); } }, [destinations, initialized, stopIds]);
  useEffect(() => { if (initialized) localStorage.setItem(storageKey, JSON.stringify(stopIds)); }, [stopIds, initialized]);
  const stops = useMemo(() => stopIds.map(id => destinations?.find(d => d.id === id)).filter((d): d is DestinationRow => Boolean(d)), [stopIds, destinations]);
  const available = (destinations ?? []).filter(d => !d.placeholder && !stopIds.includes(d.id));
  const points: LBPoint[] = stops.filter(d => d.lat != null && d.lng != null).map(d => ({ id:d.id, lat:d.lat!, lng:d.lng!, name:d.name, kind:d.type, href:`/explore/${d.slug}` }));
  const straightDistance = points.slice(1).reduce((sum,p,i) => sum + distanceKm(points[i], p), 0);
  const suggestions = useMemo(() => {
    const rows = (destinations ?? []).filter(d => !d.placeholder && d.lat != null && d.lng != null);
    if (suggestion === "Nature Lovers") return rows.filter(d => d.type === "Nature" || d.type === "Relaxation").slice(0, 5);
    if (suggestion === "Food Trip") return rows.filter(d => d.type === "Food").slice(0, 5);
    if (suggestion === "Family Day") return rows.filter(d => d.type === "Attractions" || d.type === "Culture" || d.type === "Nature").slice(0, 5);
    return rows.slice(0, 4);
  }, [destinations, suggestion]);
  const replaceWithSuggestion = () => { if (suggestions.length) { setStopIds(suggestions.map(d => d.id)); notify("Plan updated with real Los Baños places."); } };
  const onDrop = (event: DragEvent<HTMLElement>, target: number) => { event.preventDefault(); if (dragged === null || dragged === target) return; setStopIds(ids => { const next = [...ids]; const [item] = next.splice(dragged,1); next.splice(target,0,item); return next; }); setDragged(null); };
  return <><Header/><main className="plan-page"><div className="plan-layout"><div className="plan-primary">
    <PageHero className="plan-hero" title="Plan Your Day in LB" subtitle="Make the most of your time in Los Baños." body="Create your own itinerary with real places, local food, and memorable experiences." image={conceptImages.planHero.src} imageAlt={conceptImages.planHero.alt}/>
    <section className="plan-panel plan-setup"><h2>Start Planning</h2><div className="plan-fields"><label>Start location<input value={start} onChange={e=>setStart(e.target.value)} placeholder="Where are you starting?"/></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label>Travel mode<select value={mode} onChange={e=>setMode(e.target.value)}><option>Private car</option><option>Public transport</option><option>Walking</option></select></label><Button onClick={() => notify("Your itinerary is ready below. Changes are saved on this device.")}>Create Itinerary <ArrowRight size={15}/></Button></div></section>
    <section className="plan-panel plan-itinerary"><div className="plan-section-head"><div><h2>Your Itinerary</h2><span>{stops.length} {stops.length === 1 ? "stop" : "stops"} planned</span></div><div className="plan-view-toggle" role="group" aria-label="Itinerary view"><button type="button" className={view === "map" ? "active" : ""} aria-pressed={view === "map"} onClick={()=>setView("map")}><Map size={15}/> Map</button><button type="button" className={view === "list" ? "active" : ""} aria-pressed={view === "list"} onClick={()=>setView("list")}><List size={15}/> List</button></div></div>
      {error && <p className="plan-empty">Places could not be loaded. Please try again later.</p>}{isLoading && <p className="plan-empty">Loading places…</p>}<div className={`plan-workspace ${view === "list" ? "plan-list-view" : ""}`}><div className="plan-stop-column"><ol className="plan-stops">{stops.map((d,i)=><li key={d.id} draggable onDragStart={()=>setDragged(i)} onDragEnd={()=>setDragged(null)} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,i)}><span className="plan-stop-number">{i+1}</span><img src={imageFor(d)} alt=""/><div><Link href={`/explore/${d.slug}`}><strong>{d.name}</strong></Link><small>{d.type}{d.place ? ` · ${d.place}` : ""}</small></div><button className="plan-remove" type="button" onClick={()=>setStopIds(ids=>ids.filter(id=>id!==d.id))} aria-label={`Remove ${d.name}`}><Trash2 size={15}/></button><GripVertical className="plan-grip" size={17}/></li>)}</ol>{!stops.length && <p className="plan-empty">Add a place to begin your day.</p>}<div className="plan-add"><select aria-label="Choose a place to add" value={addId} onChange={e=>setAddId(e.target.value)}><option value="">Choose a place</option>{available.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select><button type="button" disabled={!addId} onClick={()=>{setStopIds(ids=>[...ids,addId]);setAddId("");}}><Plus size={16}/> Add Stop</button></div></div><div className="plan-map-column">{view === "map" ? <MapView points={points} numbered routeLine fitBounds height={475} ariaLabel="Numbered itinerary stops in Los Baños"/> : <div className="plan-list-detail"><h3>Your route</h3><p>Drag the handles on your stops to change their order. Select a place to see details.</p><ol>{stops.map(d=><li key={d.id}><Link href={`/explore/${d.slug}`}>{d.name} <ArrowRight size={14}/></Link><span>{d.type}</span></li>)}</ol></div>}<div className="plan-totals"><div><Route size={22}/><span><small>Between stops · straight line</small><strong>{points.length > 1 ? `${straightDistance.toFixed(1)} km` : "—"}</strong></span></div><div><CalendarDays size={22}/><span><small>Stops</small><strong>{stops.length} {stops.length === 1 ? "place" : "places"}</strong></span></div></div></div></div>
    </section>
  </div><div className="plan-rail"><RightRailCard title="Plan Suggestions" seeAllHref="/explore" className="plan-suggestions"><ChipGroup label="Find a theme" options={suggestionTypes} selected={suggestion} onChange={setSuggestion}/>{suggestions.length ? <article className="plan-suggestion-card"><img src={suggestion === "Food Trip" ? conceptImages.foodBreakfast.src : suggestion === "Nature Lovers" ? conceptImages.homeForestFalls.src : conceptImages.planHero.src} alt=""/><div><h3>{suggestion === "Quick Trip" ? "Explore Los Baños" : suggestion}</h3><p>{suggestions.map(d=>d.name).slice(0,3).join(", ")}{suggestions.length > 3 ? "…" : ""}</p><small><MapPin size={13}/>{suggestions.length} real places</small><button type="button" onClick={replaceWithSuggestion}>Use This Plan</button></div></article> : <p className="plan-empty">No matching places are listed yet.</p>}</RightRailCard>
    <RightRailCard title="Your Plan Summary" className="plan-summary"><div><MapPin size={18}/><span><b>Start Point</b>{start || "Choose a start location"}</span></div><div><Flag size={18}/><span><b>End Point</b>{stops.at(-1)?.name || "Add a stop"}</span></div><div><Clock3 size={18}/><span><b>Start Time</b>{date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}) : "Choose a date"} · {time}</span></div><div>{mode === "Walking" ? <Footprints size={18}/> : mode === "Private car" ? <Car size={18}/> : <Bus size={18}/>}<span><b>Travel Mode</b>{mode}</span></div><SkylineBand/></RightRailCard>
    <aside className="plan-tip"><Lightbulb size={28}/><div><h2 className="script-accent">Tip!</h2><p>Start early to enjoy more places and avoid afternoon traffic.</p></div></aside></div></div><div className="plan-community"><CommunityStrip items={[{icon:<MapPin/>,label:"Locally rooted"},{icon:<Users/>,label:"Community driven"},{icon:<Compass/>,label:"Made for discovery"}]}/></div></main><Footer/><BottomNav/></>;
}
