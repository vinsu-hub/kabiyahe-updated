import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink, Heart, MapPin, MessageCircle, Phone, Search, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";

type GuideImages = { hero: string; falls: string; lake: string; sunset: string };
type GuideDestination = { name: string; place: string };
type GuideShellProps = { Header: React.ComponentType; BottomNav: React.ComponentType; Button: React.ComponentType<any>; images: GuideImages; destinations: GuideDestination[] };

type Guide = {
  slug: string;
  displayName: string;
  image: string;
  serviceAreas: GuideDestination[];
  specialties: string[];
  contactPhone?: string;
  contactMessageUrl?: string;
  contactSocialUrl?: string;
  bio: string;
  typicalRate: string;
  verification: "curated" | "unverified";
  status: "active";
  fit: string;
};

const guideData = (images: GuideImages, destinations: GuideDestination[]): Guide[] => {
  const byName = new Map(destinations.map(destination => [destination.name, destination]));
  const areas = (...names: string[]) => names.map(name => byName.get(name)).filter((destination): destination is GuideDestination => Boolean(destination));
  return [
  {
    slug: "kuya-ramon",
    displayName: "Kuya Ramon",
    image: images.hero,
    serviceAreas: areas("Los Baños Hot Springs", "Caliraya Lake"),
    specialties: ["Hiking", "Nature Walks"],
    bio: "A local trail-guide profile for travelers planning a slower, more grounded day around Mount Makiling. Confirm availability, accreditation, and group arrangements directly before hiring.",
    typicalRate: "Confirm directly",
    verification: "curated",
    status: "active",
    fit: "Best for first-time hikers",
  },
  {
    slug: "ate-liza",
    displayName: "Ate Liza",
    image: images.falls,
    serviceAreas: areas("Pagsanjan Falls", "Majayjay Church"),
    specialties: ["Boat Tours", "Nature Walks"],
    bio: "A curated local guide profile for travelers visiting Pagsanjan Falls and the surrounding river route. Ask about the exact route, group size, and weather plan before confirming.",
    typicalRate: "Confirm directly",
    verification: "curated",
    status: "active",
    fit: "Best for waterfall days",
  },
  {
    slug: "mang-jun",
    displayName: "Mang Jun",
    image: images.lake,
    serviceAreas: areas("Caliraya Lake", "Nuvali Lakeside"),
    specialties: ["Nature Walks", "Cultural Tours"],
    bio: "A curated local guide profile for lake-side exploring, quiet viewpoints, and nearby cultural stops. Confirm transport, inclusions, and availability directly before hiring.",
    typicalRate: "Confirm directly",
    verification: "unverified",
    status: "active",
    fit: "Best for relaxed exploring",
  },
  {
    slug: "ate-mila",
    displayName: "Ate Mila",
    image: images.sunset,
    serviceAreas: areas("Majayjay Church", "Bato Resort"),
    specialties: ["Historical / Heritage", "Cultural Tours"],
    bio: "A curated local guide profile for heritage-minded travelers exploring Majayjay and nearby town stories. Ask for the current meeting point and route length before arranging a visit.",
    typicalRate: "Confirm directly",
    verification: "unverified",
    status: "active",
    fit: "Best for story-led days",
  },
  ];
};

const normalize = (value: string) => value.toLowerCase();

function GuideCard({ guide, Button }: { guide: Guide; Button: React.ComponentType<any> }) {
  return <article className="guide-card">
    <Link href={`/guides/${guide.slug}`} className="guide-card-image"><img src={guide.image} alt={`${guide.displayName} local guide profile`} /><span className={`guide-badge ${guide.verification}`}>{guide.verification === "curated" ? <><ShieldCheck size={13} /> Curated listing</> : "Unverified"}</span></Link>
    <div className="guide-card-body">
      <div className="guide-card-title"><div><Link href={`/guides/${guide.slug}`}><h2>{guide.displayName}</h2></Link><p className="muted"><MapPin size={14} /> {guide.serviceAreas[0]?.name || "Laguna"}</p></div><button className="guide-save" aria-label={`Save ${guide.displayName}`} onClick={() => window.dispatchEvent(new CustomEvent("kabiyahe:notice", { detail: "Guide saved for later." }))}><Heart size={17} /></button></div>
      <div className="guide-specialties">{guide.specialties.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
      <p className="guide-card-copy">{guide.fit}</p>
      <div className="guide-card-footer"><span><Users size={14} /> {guide.serviceAreas.length} areas</span><Button href={`/guides/${guide.slug}`} variant="outline">View guide <ArrowRight size={14} /></Button></div>
    </div>
  </article>;
}

export function GuidesDirectory({ Header, BottomNav, Button, images, destinations }: GuideShellProps) {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const initialPlace = params.get("place") || "All Laguna";
  const guides = useMemo(() => guideData(images, destinations), [images, destinations]);
  const [place, setPlace] = useState(initialPlace);
  const [specialty, setSpecialty] = useState("All specialties");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Recommended");
  const places = ["All Laguna", ...Array.from(new Set(guides.flatMap(guide => guide.serviceAreas.map(area => area.name))))];
  const specialties = ["All specialties", ...Array.from(new Set(guides.flatMap(guide => guide.specialties)))];
  const filtered = useMemo(() => guides.filter(guide => {
    const haystack = normalize(`${guide.displayName} ${guide.serviceAreas.map(area => area.name).join(" ")} ${guide.specialties.join(" ")}`);
    return (place === "All Laguna" || guide.serviceAreas.some(area => area.name === place)) && (specialty === "All specialties" || guide.specialties.includes(specialty)) && haystack.includes(normalize(query));
  }).sort((a, b) => sort === "Alphabetical" ? a.displayName.localeCompare(b.displayName) : sort === "Verified first" ? Number(b.verification === "curated") - Number(a.verification === "curated") : 0), [guides, place, specialty, query, sort]);
  const reset = () => { setPlace("All Laguna"); setSpecialty("All specialties"); setQuery(""); setSort("Recommended"); };
  return <><Header /><main className="container guides-page">
    <Link href="/explore" className="back-link"><ArrowLeft size={16} /> Back to Explore</Link>
    <section className="guides-hero"><div><p className="eyebrow">LOCAL KNOWLEDGE, CLOSE BY</p><h1>Find a local guide.</h1><p>Connect with people who know Laguna’s trails, waterways, and stories best. Browse by place, then arrange contact directly.</p></div><div className="guides-hero-mark"><MapPin size={28} /><span>Place-based<br />recommendations</span></div></section>
    <section className="guides-trust"><ShieldCheck size={18} /><span><b>Discovery, not booking.</b><small>Guide profiles are for research only. Kabiyahe does not process guide bookings, payments, or guarantees of availability.</small></span></section>
    <section className="guides-controls" aria-label="Guide filters"><label><MapPin size={15} /> Place<select value={place} onChange={event => setPlace(event.target.value)}>{places.map(value => <option value={value} key={value}>{value}</option>)}</select></label><label><SlidersHorizontal size={15} /> Specialty<select value={specialty} onChange={event => setSpecialty(event.target.value)}>{specialties.map(value => <option value={value} key={value}>{value}</option>)}</select></label><label className="guide-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search guide or place..." aria-label="Search guide or place" /></label><label className="guide-sort">Sort<select value={sort} onChange={event => setSort(event.target.value)}><option>Recommended</option><option>Verified first</option><option>Alphabetical</option></select></label></section>
    <div className="guides-results-head"><div><p className="eyebrow">GUIDE DIRECTORY</p><h2>{filtered.length} {filtered.length === 1 ? "guide profile" : "guide profiles"}</h2></div>{(place !== "All Laguna" || specialty !== "All specialties" || query || sort !== "Recommended") && <button className="link-accent" onClick={reset}>Clear filters</button>}</div>
    {filtered.length ? <div className="guides-grid">{filtered.map(guide => <GuideCard guide={guide} Button={Button} key={guide.slug} />)}</div> : <div className="empty-state guides-empty"><Search size={26} /><h3>No guides listed for this spot yet.</h3><p>Check nearby areas, or contact the destination directly.</p><button className="btn outline" onClick={reset}>Browse all Laguna</button></div>}
    <section className="guides-callout"><div><p className="eyebrow">PLANNING A STOP?</p><h2>Start with the place, not the guesswork.</h2><p>Open a guide directory from an itinerary stop whenever you need local context. Contact and hiring happen directly with the guide.</p></div><Button href="/plan/new"><MessageCircle size={16} /> Plan with Kabiyahe</Button></section>
  </main><BottomNav /></>;
}

export function GuideDetail({ Header, BottomNav, Button, images, destinations, id }: GuideShellProps & { id?: string }) {
  const guide = guideData(images, destinations).find(item => item.slug === id) || guideData(images, destinations)[0];
  return <><Header /><main className="container guide-detail-page"><Link href="/guides" className="back-link"><ArrowLeft size={16} /> Back to Guides</Link><section className="guide-detail-hero"><img src={guide.image} alt={`${guide.displayName} local guide profile`} /><div className="guide-detail-intro"><span className={`guide-badge ${guide.verification}`}>{guide.verification === "curated" ? <><ShieldCheck size={13} /> Curated listing</> : "Unverified — confirm details directly"}</span><h1>{guide.displayName}</h1><p className="muted"><MapPin size={16} /> Local guide profile · {guide.serviceAreas[0]?.name || "Laguna"}</p><p className="guide-detail-fit">{guide.fit}</p></div></section><div className="guide-detail-layout"><section className="guide-detail-main"><div className="guide-detail-block"><p className="eyebrow">AREAS COVERED</p><div className="guide-area-list">{guide.serviceAreas.map(area => <span key={area.name}><MapPin size={15} /> {area.name}</span>)}</div></div><div className="guide-detail-block"><p className="eyebrow">SPECIALTIES</p><div className="guide-specialties">{guide.specialties.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div></div><div className="guide-detail-block"><p className="eyebrow">ABOUT</p><p className="guide-about">{guide.bio}</p></div><div className="guide-detail-block guide-rate"><div><p className="eyebrow">TYPICAL RATE</p><strong>{guide.typicalRate}</strong></div><small>Confirm the current rate, inclusions, and group terms directly with the guide.</small></div><div className="guide-detail-block guide-contact"><p className="eyebrow">CONTACT</p>{guide.contactPhone || guide.contactMessageUrl || guide.contactSocialUrl ? <div className="guide-contact-actions">{guide.contactPhone && <a href={`tel:${guide.contactPhone}`}><Phone size={16} /> Call</a>}{guide.contactMessageUrl && <a href={guide.contactMessageUrl} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Message</a>}{guide.contactSocialUrl && <a href={guide.contactSocialUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Social</a>}</div> : <p className="guide-contact-unavailable"><MessageCircle size={16} /> No direct contact channel is published for this listing yet. Confirm the guide’s current contact details through the destination before hiring.</p>}</div></section><aside className="guide-detail-aside"><div className="guide-offplatform"><ShieldCheck size={20} /><h2>Arrange directly</h2><p>Bookings and payment are arranged directly with the guide. Kabiyahe does not process guide bookings or payments.</p></div><div className="guide-verification-card"><Check size={17} /><span><b>{guide.verification === "curated" ? "Curated for discovery" : "Unverified listing"}</b><small>{guide.verification === "curated" ? "Confirm all details directly before hiring." : "Confirm identity, availability, and credentials directly."}</small></span></div><Button href={`/guides?place=${encodeURIComponent(guide.serviceAreas[0]?.name || "All Laguna")}`} variant="secondary"><MapPin size={16} /> More guides nearby</Button></aside></div></main><BottomNav /></>;
}

export default GuidesDirectory;
