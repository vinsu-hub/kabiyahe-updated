import fs from "node:fs";
const path = "client/src/App.tsx";
const lines = fs.readFileSync(path, "utf8").split("\n");
const quickModal = [
  'function QuickReferenceModal({trip,onClose}:{trip:any;onClose:()=>void}){',
  '  return <Modal title="Quick references" onClose={onClose}>',
  '    <div className="quick-reference-modal">',
  '      <p className="muted">{trip.name}</p>',
  '      <div className="quick-reference-list">',
  '        {trip.refs.map((reference:any)=><div className="quick-reference-row" key={reference.code}>',
  '          <span><Ticket size={15}/><b>{reference.label}</b></span>',
  '          <strong>{reference.code}</strong>',
  '        </div>)}',
  '      </div>',
  '      <p className="quick-reference-note">For the full ticket screenshot, notes, and sharing controls, open the trip wallet.</p>',
  '      <Button href={"/trips/"+trip.id+"/wallet"} onClick={onClose}><WalletCards size={15}/> Open full wallet</Button>',
  '    </div>',
  '  </Modal>;',
  '}',
].join("\n");
const trips = [
  'function Trips(){',
  '  const [filter,setFilter]=useState("All Trips");',
  '  const [quickWallet,setQuickWallet]=useState<any>(null);',
  '  const trips=[',
  '    {id:"laguna-weekend",name:"Laguna Weekend Escape",image:IMG.falls,status:"In Progress",kind:"Active",meta:"Jun 12 – Jun 13, 2025　•　2 Days, 1 Night　•　4 Travelers",tags:["Nature","Adventure"],saved:"2 of 5 bookings saved",refs:[{label:"Pagsanjan Boat Ride",code:"PBR-2406-18"},{label:"Lakeside stay",code:"CAL-8821"}]},',
  '    {id:"laguna-adventure",name:"Laguna Adventure",image:IMG.sunset,status:"In Progress",kind:"Active",meta:"May 24 – May 25, 2025　•　2 Days, 1 Night　•　3 Travelers",tags:["Adventure","Nature"],saved:"4 of 6 bookings saved",refs:[{label:"Waterfall entry",code:"PAG-7314"},{label:"Van transfer",code:"LAG-5520"}]},',
  '  ];',
  '  const visible=filter==="All Trips"?trips:trips.filter(trip=>trip.kind===filter);',
  '  return <><Header/><main className="container trips-page">',
  '    <div className="listing-heading"><div><h1>My Trips <Sparkles size={22}/></h1><p>All your adventures, plans, and booking references in one place.</p></div><Button href="/plan/new"><Plus size={17}/> New Trip</Button></div>',
  '    <div className="trips-content"><section>',
  '      <div className="filter-pills trip-filters">{["All Trips","Upcoming","Active","Completed","Archived"].map(item=><button className={filter===item?"active":""} onClick={()=>setFilter(item)} key={item}>{item}</button>)}</div>',
  '      {visible.map(trip=><article className="trip-card" key={trip.id}><img src={trip.image} alt={trip.name}/><div><div className="trip-card-top"><Tag tone="sage">{trip.status}</Tag></div><h2>{trip.name}</h2><p className="muted"><MapPin size={14}/>{trip.meta}</p><div>{trip.tags.map(tag=><Tag key={tag}>{tag}</Tag>)}</div><p>Budget: <b>₱₱ Moderate</b></p><small>{trip.saved}</small><div className="progress"><span style={{width:"64%"}}/></div><div className="trip-card-actions"><Button href={"/trips/"+trip.id} variant="outline"><Map size={14}/> View Itinerary</Button><Button href={"/trips/"+trip.id+"/wallet"} variant="outline"><WalletCards size={14}/> Bookings</Button><button className="quick-reference-btn" onClick={()=>setQuickWallet(trip)}><Ticket size={14}/> Quick reference</button><Button href={"/trips/"+trip.id} variant="primary">Open Trip <ArrowRight size={15}/></Button></div></div></article>)}',
  '      {visible.length===0&&<div className="empty-state"><Map size={28}/><h3>No trips in this view yet.</h3><p>Create a plan and it will appear here.</p><Button href="/plan/new">Plan a trip</Button></div>}',
  '    </section></div></main>{quickWallet&&<QuickReferenceModal trip={quickWallet} onClose={()=>setQuickWallet(null)}/>}<BottomNav/></>;',
  '}',
].join("\n");
lines.splice(109, 2, ...quickModal.split("\n"), ...trips.split("\n"));
fs.writeFileSync(path, lines.join("\n"));
