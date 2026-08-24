import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Compass, Heart, Map as MapIcon, MapPin, Pencil, Plus, Sparkles, Users, WalletCards, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const budgetLabels = ["Budget", "Moderate", "Comfort", "Luxury"];
const interestOptions = ["Nature", "Adventure", "Food", "Culture", "Relaxation", "Family Friendly", "Romance", "Hidden Gems"];
const loadingMessages = [
  "Finding the best spots in Laguna for you...",
  "Checking verified destinations...",
  "Building your itinerary...",
];
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
    <div>{selected.length ? selected.map((item: string) => <Tag key={item}>{item}</Tag>) : <span className="muted">Choose at least one interest</span>}</div>
    <p className="summary-note"><Pencil size={14} /> {notes || "No special notes added."}</p>
    <div className="info-box">ⓘ Our AI will create an itinerary based on verified destinations in Laguna.</div>
  </aside>;
}

function Stepper({ step }: { step: number }) {
  return <div className="stepper">
    <span className={step >= 1 ? "current" : ""}>1</span><b>Trip Details<small>Tell us the basics</small></b><i />
    <span className={step >= 2 ? "current" : ""}>2</span><b>Preferences<small>Your interests & style</small></b><i />
    <span className={step >= 3 ? "current" : ""}>3</span><b>Review<small>Generate itinerary</small></b>
  </div>;
}

export function Plan({ Header, BottomNav, Button, Tag, IMG }: any) {
  const [selected, setSelected] = useState(["Nature", "Food", "Relaxation", "Hidden Gems"]);
  const [group, setGroup] = useState(4);
  const [budget, setBudget] = useState(2);
  const [dateStart, setDateStart] = useState("2025-06-12");
  const [dateEnd, setDateEnd] = useState("2025-06-13");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [, setLocation] = useLocation();
  const generate = trpc.planner.generate.useMutation({
    onSuccess: ({ tripId }) => {
      if (!Number.isInteger(tripId) || tripId <= 0) {
        notify("The itinerary was created without a valid trip reference. Please try again.");
        return;
      }
      setLocation(`/plan/new/result/${tripId}`);
    },
    onError: error => notify(error.message || "We couldn’t generate the route yet. Please try again."),
  });
  const valid = Boolean(dateStart && dateEnd && dateEnd >= dateStart && selected.length > 0);

  useEffect(() => {
    if (!generate.isPending) return;
    let index = 0;
    setLoadingMessage(loadingMessages[0]);
    const timer = window.setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [generate.isPending]);

  const submit = () => {
    if (!valid) return notify("Choose valid dates and at least one interest before generating.");
    generate.mutate({ startDate: dateStart, endDate: dateEnd, travelers: group, budgetLevel: budget, interests: selected, notes });
  };

  return <><Header /><main className="container plan-page">
    <div className="plan-heading"><div className="plan-illustration"><img src={IMG.emblem} alt="" /></div><div><h1>Plan Your Adventure <Sparkles size={22} /></h1><p>Tell us about your trip and let Kabiyahe create the perfect itinerary<br />just for you.</p></div></div>
    <div className={`plan-layout ${step === 3 ? "review-layout" : ""}`}><section className={`form-card ${step === 3 ? "review-form-card" : ""}`}>
      <Stepper step={step} />
      {step === 1 && <>
        <div className="step-intro"><p className="eyebrow">STEP 1 · TRIP DETAILS</p><h2>Start with the basics.</h2><p>Set the dates, group size, and budget for your Laguna escape.</p></div>
        <div className="form-grid">
          <label><span><CalendarDays /> Travel Dates</span><small>When are you traveling?</small><div className="date-row"><div>Check-in / Start date<input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} /></div><div>Check-out / End date<input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} /></div></div></label>
          <label><span><Users /> Group Size</span><small>How many are in your group?</small><div className="counter"><button onClick={() => setGroup(value => Math.max(1, value - 1))}>−</button><b>{group}</b><button onClick={() => setGroup(value => Math.min(12, value + 1))}>+</button></div><small>♙ Travelers</small></label>
          <label><span><WalletCards /> Budget Range</span><small>What's your budget like?</small><div className="budget-row">{["₱", "₱₱", "₱₱₱", "₱₱₱₱"].map((value, index) => <button className={budget === index ? "selected" : ""} onClick={() => setBudget(index)} key={value}><b>{value}</b><small>{budgetLabels[index]}</small></button>)}</div></label>
        </div>
        <div className="form-actions"><Button variant="secondary" href="/"><ArrowLeft size={16} /> Back</Button><Button onClick={() => setStep(2)}>Next: Preferences <ArrowRight size={16} /></Button></div>
      </>}
      {step === 2 && <>
        <div className="step-intro"><p className="eyebrow">STEP 2 · PREFERENCES</p><h2>Shape the feeling of your trip.</h2><p>Choose the interests and travel notes Kabiyahe should keep in mind.</p></div>
        <div className="preferences-panel"><div className="interest-section"><h3>♡　What are you interested in?</h3><p>Choose the things you and your group love.</p><div className="interest-grid">{interestOptions.map(item => <button className={selected.includes(item) ? "selected" : ""} onClick={() => setSelected(values => values.includes(item) ? values.filter(value => value !== item) : [...values, item])} key={item}><Compass size={18} />{item}{selected.includes(item) && <Check size={16} />}</button>)}</div><h3 className="other">▤　Any other preferences? <small>(Optional)</small></h3><p>Add notes or special requests for your trip.</p><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Example: We prefer chill places, not too crowded. We want to try local food!" /></div></div>
        <div className="form-actions"><Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back to Details</Button><Button onClick={() => setStep(3)} disabled={selected.length === 0}>Next: Review <ArrowRight size={16} /></Button></div>
      </>}
      {step === 3 && generate.isPending && <div className="generate-state generating"><div className="generate-mascot"><img src={IMG.emblem} alt="" /></div><div className="generate-icon"><Sparkles size={28} /></div><p className="eyebrow">BUILDING YOUR ROUTE</p><h2>{loadingMessage}</h2><p>Retrieving verified destinations and shaping a practical travel flow. This usually takes a few seconds.</p><div className="generation-progress"><span /></div><small>Your confirmed trip details stay visible while we work.</small></div>}
      {step === 3 && !generate.isPending && <div className="review-state"><div className="review-intro"><p className="eyebrow">STEP 3 · FINAL REVIEW</p><h2>Everything looks ready.</h2><p>Confirm your details before Kabiyahe spends an AI call building the itinerary.</p></div><div className="review-card-surface"><div className="review-card-header"><div className="review-card-title"><img src={IMG.lake} alt="Caliraya Lake" /><div><p className="eyebrow">YOUR TRIP SUMMARY</p><h3>Laguna Adventure</h3></div></div><span className="verified-label"><Check size={13} /> Ready to generate</span></div><div className="review-summary-grid"><div><CalendarDays size={18} /><span>Dates<b>{dateStart} → {dateEnd}</b></span><button className="review-edit" onClick={() => setStep(1)}><Pencil size={13} /> Edit</button></div><div><Users size={18} /><span>Travelers<b>{group} people</b></span><button className="review-edit" onClick={() => setStep(1)}><Pencil size={13} /> Edit</button></div><div><WalletCards size={18} /><span>Budget<b>{"₱".repeat(budget + 1)} {budgetLabels[budget]}</b></span><button className="review-edit" onClick={() => setStep(1)}><Pencil size={13} /> Edit</button></div><div><Heart size={18} /><span>Interests<b>{selected.join(", ")}</b></span><button className="review-edit" onClick={() => setStep(2)}><Pencil size={13} /> Edit</button></div></div><div className="review-note"><Pencil size={15} /><span>{notes || "No special notes added."}</span><button className="review-edit" onClick={() => setStep(2)}>Edit</button></div></div><div className="info-box">ⓘ Our AI will create an itinerary only from verified destinations in Laguna. Each generated stop will carry a verification label.</div><div className="form-actions"><Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={16} /> Edit preferences</Button><Button onClick={submit} disabled={!valid}>Generate My Itinerary <Sparkles size={16} /></Button></div>{generate.isError && <p className="form-error">We couldn’t generate the route yet. {generate.error.message}</p>}</div>}
    </section>{step < 3 && <PlannerSummary dateStart={dateStart} dateEnd={dateEnd} group={group} budget={budget} selected={selected} notes={notes} IMG={IMG} Tag={Tag} />}</div>
  </main><BottomNav /></>;
}

export function GeneratedResult({ id, Header, BottomNav, Button }: any) {
  const tripId = Number(id) || 0;
  const result = trpc.planner.get.useQuery({ tripId });
  const catalog = trpc.planner.verified.useQuery();
  const [localStops, setLocalStops] = useState<any[]>([]);
  const [draggedStop, setDraggedStop] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [saveState, setSaveState] = useState("Changes auto-saved");

  const removeStop = trpc.planner.removeStop.useMutation({
    onSuccess: async () => { setSaveState("Changes auto-saved"); await result.refetch(); notify("Stop removed and trip saved."); },
    onError: error => { setSaveState("Couldn’t save change"); notify(error.message); },
  });
  const reorderStops = trpc.planner.reorderStops.useMutation({
    onSuccess: async () => { setSaveState("Changes auto-saved"); await result.refetch(); notify("Itinerary order saved."); },
    onError: error => { setSaveState("Couldn’t save change"); notify(error.message); },
  });
  const addStop = trpc.planner.addStop.useMutation({
    onSuccess: async () => { setSaveState("Changes auto-saved"); setShowAdd(false); await result.refetch(); notify("Verified stop added and trip saved."); },
    onError: error => { setSaveState("Couldn’t save change"); notify(error.message); },
  });

  useEffect(() => {
    if (result.data?.stops) setLocalStops(result.data.stops);
  }, [result.data?.stops]);

  if (result.isLoading) return <><Header /><main className="container generated-page"><div className="generate-state generating"><div className="generate-icon"><Sparkles size={28} /></div><p className="eyebrow">LOADING YOUR TRIP</p><h2>Opening your editable itinerary...</h2><p>Keeping your verified destination context close.</p></div></main></>;
  if (result.isError || !result.data) return <><Header /><main className="container generated-page"><div className="empty-state"><X size={28} /><h2>We couldn’t open that itinerary.</h2><p>{result.error?.message || "Generated trip not found."}</p><Button href="/plan/new">Plan again</Button></div></main><BottomNav /> </>;

  const visibleStops = localStops.slice().sort((a: any, b: any) => a.dayNumber - b.dayNumber || a.stopOrder - b.stopOrder);
  const groups = new globalThis.Map<number, any[]>();
  visibleStops.forEach((stop: any) => groups.set(stop.dayNumber, [...(groups.get(stop.dayNumber) || []), stop]));
  const updateOrder = (day: number, nextStops: any[]) => {
    const snapshot = localStops;
    setSaveState("Saving changes...");
    const updates = localStops.map((stop: any) => {
      const index = nextStops.findIndex(candidate => candidate.id === stop.id);
      return index >= 0 ? { id: stop.id, dayNumber: day, stopOrder: index + 1 } : { id: stop.id, dayNumber: stop.dayNumber, stopOrder: stop.stopOrder };
    });
    setLocalStops(localStops.map((stop: any) => {
      const next = updates.find(candidate => candidate.id === stop.id);
      return next ? { ...stop, dayNumber: next.dayNumber, stopOrder: next.stopOrder } : stop;
    }));
    reorderStops.mutate({ tripId, stops: updates }, {
      onError: error => { setLocalStops(snapshot); setSaveState("Couldn’t save change"); notify(error.message); },
    });
  };
  const moveStop = (day: number, stopId: number, direction: -1 | 1) => {
    const stops = [...(groups.get(day) || [])];
    const from = stops.findIndex(stop => stop.id === stopId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= stops.length) return;
    [stops[from], stops[to]] = [stops[to], stops[from]];
    updateOrder(day, stops);
  };
  const handleDrop = (day: number, targetId: number) => {
    if (draggedStop === null || draggedStop === targetId) return;
    const stops = [...(groups.get(day) || [])];
    const from = stops.findIndex(stop => stop.id === draggedStop);
    const to = stops.findIndex(stop => stop.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = stops.splice(from, 1);
    stops.splice(to, 0, moved);
    setDraggedStop(null);
    updateOrder(day, stops);
  };

  return <><Header /><main className="container generated-page"><div className="generated-heading"><div><p className="eyebrow">YOUR AI-GENERATED ROUTE</p><h1>{result.data.trip.name}</h1><p><CalendarDays size={15} /> {new Date(result.data.trip.startDate).toLocaleDateString()} → {new Date(result.data.trip.endDate).toLocaleDateString()}　•　{result.data.trip.travelers} travelers</p></div><div className="heading-actions"><Button variant="secondary" href={`/trips/${id}/itinerary`}><Pencil size={16} /> Open editable itinerary</Button><Button variant="secondary" href="/trips"><MapIcon size={16} /> My Trips</Button><Button href={`/trips/${id}/members`}><Users size={16} /> Invite</Button></div></div><div className="generated-trust"><Check size={16} /> Built from verified Laguna destinations. Review, reorder, or remove any stop before you go.<span className="auto-save-state"><Check size={13} /> {saveState}</span></div><div className="generated-layout"><section className="generated-itinerary">{Array.from(groups.entries() as Iterable<[number, any[]]>).map(([day, stops]: [number, any[]]) => <section className="generated-day" key={day}><div className="generated-day-heading"><span>DAY {day}</span><b>{day === 1 ? "Your first Laguna chapter" : "Another day to remember"}</b><button className="generated-add-stop" onClick={() => { setSelectedDay(day); setShowAdd(true); }}><Plus size={15} /> Add stop</button></div>{stops.map((stop: any, index: number) => <article className="generated-stop" key={stop.id} draggable onDragStart={() => setDraggedStop(stop.id)} onDragOver={event => event.preventDefault()} onDrop={() => handleDrop(day, stop.id)}><div className="generated-time">{stop.timeLabel}</div><div className="generated-stop-body"><div className="generated-stop-top"><div><h2>{stop.destination?.name || "Verified Laguna destination"}</h2><p><MapPin size={14} /> {stop.destination?.address || "Laguna, Philippines"}</p></div><button className="generated-remove" aria-label={`Remove ${stop.destination?.name || "stop"}`} onClick={() => { const snapshot = localStops; setSaveState("Saving changes..."); setLocalStops(items => items.filter(item => item.id !== stop.id)); removeStop.mutate({ tripId, stopId: stop.id }, { onError: error => { setLocalStops(snapshot); setSaveState("Couldn’t save change"); notify(error.message); } }); }}><X size={16} /></button></div><p>{stop.rationale || "A verified stop selected for your preferences and travel flow."}</p><span className="verified-label"><Check size={13} /> Verified Laguna destination</span><div className="generated-stop-actions"><Button variant="outline" href={`/trips/${id}/itinerary`}><Pencil size={14} /> Edit stop</Button><Button variant="outline" href={`/explore/${stop.destination?.slug || "laguna"}`}><MapPin size={14} /> Navigate</Button><button className="generated-move" aria-label={`Move ${stop.destination?.name || "stop"} earlier`} onClick={() => moveStop(day, stop.id, -1)} disabled={index === 0}>↑</button><button className="generated-move" aria-label={`Move ${stop.destination?.name || "stop"} later`} onClick={() => moveStop(day, stop.id, 1)} disabled={index === stops.length - 1}>↓</button></div></div></article>)}</section>)}</section><aside className="generated-side"><div className="summary-card"><h2>Planner notes</h2><p>{result.data.trip.notes || "No special notes added."}</p><div className="info-box">ⓘ This itinerary is grounded in Kabiyahe’s verified destination set.</div></div><div className="summary-card"><h2>Keep planning together</h2><Button href={`/trips/${id}/polls/new`}><Users size={16} /> Start a poll</Button><Button variant="secondary" href="/trips"><Check size={16} /> Save trip</Button></div></aside></div></main>{showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal add-stop-modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>Add a verified stop</h2><button onClick={() => setShowAdd(false)} aria-label="Close add stop dialog"><X size={18} /></button></div><p>Choose a verified Laguna destination to add to Day {selectedDay}.</p><label className="modal-field">Day<select value={selectedDay} onChange={event => setSelectedDay(Number(event.target.value))}>{Array.from({ length: Math.max(2, ...Array.from(groups.keys(), day => day)) }, (_, index) => <option value={index + 1} key={index + 1}>Day {index + 1}</option>)}</select></label><div className="verified-stop-picker">{catalog.isLoading && <p className="muted">Loading verified destinations...</p>}{catalog.isError && <p className="form-error">We couldn’t load the verified destination catalog.</p>}{catalog.data?.map((destination: any) => <button className="choice-row" key={destination.id} onClick={() => addStop.mutate({ tripId, destinationId: destination.id, dayNumber: selectedDay, timeLabel: "09:00 AM" })} disabled={addStop.isPending}><MapPin size={16} /><span><b>{destination.name}</b><small>{destination.address}</small></span><Plus size={17} /></button>)}</div></div></div>}</>;
}
