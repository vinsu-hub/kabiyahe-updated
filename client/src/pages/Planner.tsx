import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Compass, Heart, Map as MapIcon, MapPin, Pencil, Plus, Sparkles, Users, WalletCards, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const budgetLabels = ["Budget", "Moderate", "Comfort", "Luxury"];
const notify = (message: string) => window.dispatchEvent(new CustomEvent("kabiyahe:notice", { detail: message }));

function PlannerSummary({ dateStart, dateEnd, group, budget, selected, notes, IMG, Tag }: any) {
  return <aside className="summary-card">
    <h2>Your Trip Summary <Pencil size={15} /></h2>
    <img src={IMG.lake} alt="Caliraya Lake" />
    <h3>Laguna Adventure</h3>
    <p><CalendarDays size={15} /> {dateStart} → {dateEnd} <span>2 Days, 1 Night</span></p>
    <p><Users size={15} /> {group} Travelers</p>
    <p><WalletCards size={15} /> Budget: {"₱".repeat(budget + 1)} {budgetLabels[budget]}</p>
    <p><Heart size={15} /> Interests</p>
    <div>{selected.map((item: string) => <Tag key={item}>{item}</Tag>)}</div>
    <div className="info-box">ⓘ Our AI will create an itinerary based on verified destinations in Laguna.</div>
  </aside>;
}

export function Plan({ Header, BottomNav, Button, Tag, IMG }: any) {
  const [selected, setSelected] = useState(["Nature", "Food", "Relaxation", "Hidden Gems"]);
  const [group, setGroup] = useState(4);
  const [budget, setBudget] = useState(2);
  const [dateStart, setDateStart] = useState("2025-06-12");
  const [dateEnd, setDateEnd] = useState("2025-06-13");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const generate = trpc.planner.generate.useMutation({ onSuccess: ({ tripId }) => setLocation(`/plan/new/result/${tripId}`) });
  const valid = Boolean(dateStart && dateEnd && dateEnd >= dateStart && selected.length > 0);
  const submit = () => {
    if (!valid) return notify("Choose valid dates and at least one interest before generating.");
    generate.mutate({ startDate: dateStart, endDate: dateEnd, travelers: group, budgetLevel: budget, interests: selected, notes });
  };
  return <><Header /><main className="container plan-page">
    <div className="plan-heading"><div className="plan-illustration"><img src={IMG.emblem} alt="" /></div><div><h1>Plan Your Adventure <Sparkles size={22} /></h1><p>Tell us about your trip and let Kabiyahe create the perfect itinerary<br />just for you.</p></div></div>
    <div className="plan-layout"><section className="form-card">
      <div className="stepper"><span className={step >= 1 ? "current" : ""}>1</span><b>Trip Details<small>Tell us the basics</small></b><i /><span className={step >= 2 ? "current" : ""}>2</span><b>Preferences<small>Your interests & style</small></b><i /><span className={step >= 3 ? "current" : ""}>3</span><b>Review<small>Generate itinerary</small></b></div>
      {step < 3 && <>
        <div className="form-grid">
          <label><span><CalendarDays /> Travel Dates</span><small>When are you traveling?</small><div className="date-row"><div>Check-in / Start date<input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div><div>Check-out / End date<input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div></div></label>
          <label><span><Users /> Group Size</span><small>How many are in your group?</small><div className="counter"><button onClick={() => setGroup(v => Math.max(1, v - 1))}>−</button><b>{group}</b><button onClick={() => setGroup(v => Math.min(12, v + 1))}>+</button></div><small>♙ Travelers</small></label>
          <label><span><WalletCards /> Budget Range</span><small>What's your budget like?</small><div className="budget-row">{["₱", "₱₱", "₱₱₱", "₱₱₱₱"].map((value, index) => <button className={budget === index ? "selected" : ""} onClick={() => setBudget(index)} key={value}><b>{value}</b><small>{budgetLabels[index]}</small></button>)}</div></label>
        </div>
        <div className="interest-section"><h3>♡　What are you interested in?</h3><p>Choose the things you and your group love.</p><div className="interest-grid">{["Nature", "Adventure", "Food", "Culture", "Relaxation", "Family Friendly", "Romance", "Hidden Gems"].map(item => <button className={selected.includes(item) ? "selected" : ""} onClick={() => setSelected(values => values.includes(item) ? values.filter(value => value !== item) : [...values, item])} key={item}><Compass size={18} />{item}{selected.includes(item) && <Check size={16} />}</button>)}</div><h3 className="other">▤　Any other preferences? <small>(Optional)</small></h3><p>Add notes or special requests for your trip.</p><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Example: We prefer chill places, not too crowded. We want to try local food!" /><div className="form-actions"><Button variant="secondary" href="/"><ArrowLeft size={16} /> Back</Button><Button onClick={() => setStep(step === 1 ? 2 : 3)}>{step === 1 ? "Next: Preferences" : "Next: Review"} <ArrowRight size={16} /></Button></div></div>
      </>}
      {step === 3 && generate.isPending && <div className="generate-state generating"><div className="generate-icon"><Sparkles size={28} /></div><p className="eyebrow">BUILDING YOUR ROUTE</p><h2>Finding the best spots in Laguna for you...</h2><p>Retrieving verified destinations and shaping a practical travel flow. This usually takes a few seconds.</p><div className="generation-progress"><span /></div><small>Your trip summary stays visible while we work.</small></div>}
      {step === 3 && !generate.isPending && <div className="review-state"><p className="eyebrow">STEP 3 · FINAL REVIEW</p><h2>Everything looks ready.</h2><p>Confirm your details before Kabiyahe spends an AI call building the itinerary.</p><div className="review-summary-grid"><div><CalendarDays size={18} /><span>Dates<b>{dateStart} → {dateEnd}</b></span></div><div><Users size={18} /><span>Travelers<b>{group} people</b></span></div><div><WalletCards size={18} /><span>Budget<b>{"₱".repeat(budget + 1)} {budgetLabels[budget]}</b></span></div><div><Heart size={18} /><span>Interests<b>{selected.join(", ")}</b></span></div></div><div className="review-note"><Pencil size={15} /><span>{notes || "No special notes added."}</span></div><div className="info-box">ⓘ Our AI will create an itinerary only from verified destinations in Laguna. Each generated stop will carry a verification label.</div><div className="form-actions"><Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={16} /> Edit preferences</Button><Button onClick={submit} disabled={!valid}>Generate My Itinerary <Sparkles size={16} /></Button></div>{generate.isError && <p className="form-error">We couldn’t generate the route yet. {generate.error.message}</p>}</div>}
    </section><PlannerSummary dateStart={dateStart} dateEnd={dateEnd} group={group} budget={budget} selected={selected} notes={notes} IMG={IMG} Tag={Tag} /></div>
  </main><BottomNav /></>;
}

export function GeneratedResult({ id, Header, BottomNav, Button }: any) {
  const result = trpc.planner.get.useQuery({ tripId: Number(id) || 0 });
  const [removed, setRemoved] = useState<number[]>([]);
  if (result.isLoading) return <><Header /><main className="container generated-page"><div className="generate-state generating"><div className="generate-icon"><Sparkles size={28} /></div><p className="eyebrow">LOADING YOUR TRIP</p><h2>Opening your editable itinerary...</h2><p>Keeping your verified destination context close.</p></div></main></>;
  if (result.isError || !result.data) return <><Header /><main className="container generated-page"><div className="empty-state"><X size={28} /><h2>We couldn’t open that itinerary.</h2><p>{result.error?.message || "Generated trip not found."}</p><Button href="/plan/new">Plan again</Button></div></main><BottomNav /></>;
  const groups = new globalThis.Map<number, any[]>();
  result.data.stops.forEach((stop: any) => { if (!removed.includes(stop.id)) groups.set(stop.dayNumber, [...(groups.get(stop.dayNumber) || []), stop]); });
  return <><Header /><main className="container generated-page"><div className="generated-heading"><div><p className="eyebrow">YOUR AI-GENERATED ROUTE</p><h1>{result.data.trip.name}</h1><p><CalendarDays size={15} /> {new Date(result.data.trip.startDate).toLocaleDateString()} → {new Date(result.data.trip.endDate).toLocaleDateString()}　•　{result.data.trip.travelers} travelers</p></div><div className="heading-actions"><Button variant="secondary" href={`/trips/${id}/itinerary`}><Pencil size={16} /> Open editable itinerary</Button><Button variant="secondary" href="/trips"><MapIcon size={16} /> My Trips</Button><Button href={`/trips/${id}/members`}><Users size={16} /> Invite</Button></div></div><div className="generated-trust"><Check size={16} /> Built from verified Laguna destinations. Review, reorder, or remove any stop before you go.</div><div className="generated-layout"><section className="generated-itinerary">{Array.from(groups.entries() as Iterable<[number, any[]]>).map(([day, stops]: [number, any[]]) => <section className="generated-day" key={day}><div className="generated-day-heading"><span>DAY {day}</span><b>{day === 1 ? "Your first Laguna chapter" : "Another day to remember"}</b><Link className="generated-add-stop" href={`/trips/${id}/itinerary`}><Plus size={15} /> Add stop</Link></div>{stops.map((stop: any) => <article className="generated-stop" key={stop.id}><div className="generated-time">{stop.timeLabel}</div><div className="generated-stop-body"><div className="generated-stop-top"><div><h2>{stop.destination?.name || "Verified Laguna destination"}</h2><p><MapPin size={14} /> {stop.destination?.address || "Laguna, Philippines"}</p></div><button className="generated-remove" aria-label={`Remove ${stop.destination?.name || "stop"}`} onClick={() => setRemoved(items => [...items, stop.id])}><X size={16} /></button></div><p>{stop.rationale || "A verified stop selected for your preferences and travel flow."}</p><span className="verified-label"><Check size={13} /> Verified Laguna destination</span><div className="generated-stop-actions"><Button variant="outline" href={`/trips/${id}/itinerary`}><Pencil size={14} /> Edit stop</Button><Button variant="outline" href={`/explore/${stop.destination?.slug || "laguna"}`}><MapPin size={14} /> Navigate</Button></div></div></article>)}</section>)}</section><aside className="generated-side"><div className="summary-card"><h2>Planner notes</h2><p>{result.data.trip.notes || "No special notes added."}</p><div className="info-box">ⓘ This itinerary is grounded in Kabiyahe’s verified destination set.</div></div><div className="summary-card"><h2>Keep planning together</h2><Button href={`/trips/${id}/polls/new`}><Users size={16} /> Start a poll</Button><Button variant="secondary" href="/trips"><Check size={16} /> Save trip</Button></div></aside></div></main><BottomNav /></>;
}
