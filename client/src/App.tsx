/* El-Biyahe! — Come Curious. Los Baños field-companion web app. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useCurrentSeason, useEvents, useTours } from "@/lib/supabase/queries";
import { BusTours, ComingSoon, Delicacies, EventDetail, EventsList, Passport, RideGuide, StayEat, TourDetail } from "@/pages/ElbiyaheFeatures";
import { Auth } from "@/pages/Auth";
import { RequireAdmin } from "@/pages/admin/AdminShell";
import { AdminAccommodations, AdminDashboard, AdminDelicacies, AdminEvents, AdminPassport, AdminTours } from "@/pages/admin/AdminPages";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Archive, BadgeAlert, Bell, BellRing, Bookmark, CalendarDays, Car, Check, CheckCheck, ChevronDown,
  ChevronRight, Clock3, Compass, ExternalLink, Grid2X2, Heart, Landmark, List,
  Map, MapPin, Menu, Megaphone, MoonStar, Mountain, Navigation, Pencil, Plus, Radio, Search, Share2,
  SlidersHorizontal, Sparkles, Star, Ticket, Users, Utensils, WalletCards, X, ShieldCheck
} from "lucide-react";

// Scenic stock photography lives in the gitignored client/public/assets/ — run
// `pnpm assets:download` (pulls the verified GitHub-release archive). El-Biyahe! logo
// art is committed under client/public/brand/.
const IMG = {
  hero: "/assets/kabiyahe-hero-laguna_e334210c.jpg",
  lake: "/assets/kabiyahe-calinaya-lake_96b9ff18.jpg",
  falls: "/assets/kabiyahe-pagsanjan-falls_bd37de01.jpg",
  sunset: "/assets/kabiyahe-bundles-sunset_99ff267e.jpg",
  enchantedKingdom: "/assets/enchanted-kingdom_a3aaee52.jpg",
  alFresco: "/assets/al-fresco-springs_c60eb0da.jpg",
  laresio: "/assets/laresio-lakeside_049170eb.jpg",
  emblem: "/brand/elbiyahe-mark.png",
  logoH: "/brand/elbiyahe-logo-horizontal.png",
};
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const notify = (message: string) => window.dispatchEvent(new CustomEvent("elbiyahe:notice", { detail: message }));
const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = () => reject(reader.error || new Error("Could not read file.")); reader.readAsDataURL(file); });
const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const destinations = [
  { name: "Pagsanjan Falls", place: "Pagsanjan, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Nature", icon: Mountain, description: "Famous waterfall connected with the historic Pagsanjan Boat Ride.", rating: "4.7", reviews: "532", tags: ["Adventure", "Waterfalls", "Hidden Gem"], price: 2 },
  { name: "Caliraya Lake", place: "Lumban, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Nature", icon: Mountain, description: "Scenic lake perfect for boating, camping, and relaxing.", rating: "4.6", reviews: "412", tags: ["Scenic Views", "Family Friendly", "Budget Friendly"], price: 2 },
  { name: "Majayjay Church", place: "Majayjay, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: Landmark, description: "Historic baroque church known as the Little Rome of the Philippines.", rating: "4.8", reviews: "298", tags: ["Culture", "Budget Friendly", "Hidden Gem"], price: 1 },
  { name: "Los Baños Hot Springs", place: "Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.falls], type: "Relaxation", icon: Sparkles, description: "Warm mineral pools tucked into a lush mountain landscape.", rating: "4.7", reviews: "361", tags: ["Relaxation", "Family Friendly", "Romantic"], price: 3 },
  { name: "Nuvali Lakeside", place: "Santa Rosa, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Attractions", icon: Compass, description: "Open-air lakeside escape with food, cycling, and sunset views.", rating: "4.5", reviews: "510", tags: ["Family Friendly", "Food", "Scenic Views"], price: 2 },
  { name: "Bato Resort", place: "Pila, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Relaxation", icon: Sparkles, description: "A quiet countryside stop for slow mornings and cool water.", rating: "4.4", reviews: "187", tags: ["Relaxation", "Budget Friendly"], price: 1 },
  { name: "Danielitos Home Kitchen", place: "Laguna, Philippines", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.sunset], type: "Food", icon: Utensils, description: "Placeholder restaurant listing for a home-kitchen dining stop. Details to be verified.", tags: ["Food", "Local Flavors", "Placeholder Listing"], price: 2, placeholder: true },
  { name: "Malayas Cafe", place: "Laguna, Philippines", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Food", icon: Utensils, description: "Placeholder cafe listing for a relaxed food stop. Details to be verified.", tags: ["Food", "Cafe", "Placeholder Listing"], price: 2, placeholder: true },
  { name: "Rizal Shrine", place: "Calamba, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: Landmark, description: "A heritage stop in Calamba, the birthplace of national hero José Rizal.", tags: ["Culture", "Heritage", "Family Friendly"], price: 1, verified: true },
  { name: "Seven Crater Lakes", place: "San Pablo City, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.falls], type: "Nature", icon: Mountain, description: "A collection of San Pablo’s seven crater lakes, including Sampaloc, Pandin, and Yambo.", tags: ["Scenic Views", "Nature", "Hidden Gem"], price: 1, verified: true },
  { name: "Mount Makiling", place: "Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.falls, IMG.lake], type: "Attractions", icon: Mountain, description: "A landmark mountain landscape associated with hiking, fresh air, and panoramic Laguna views.", tags: ["Adventure", "Scenic Views", "Nature"], price: 2, verified: true },
  { name: "Paete Woodcarving Heritage", place: "Paete, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: Landmark, description: "A town heritage stop celebrating Paete’s longstanding tradition of intricate woodcarving.", tags: ["Culture", "Arts", "Hidden Gem"], price: 1, verified: true },
  { name: "Enchanted Kingdom", place: "Santa Rosa, Laguna", image: IMG.enchantedKingdom, gallery: [IMG.enchantedKingdom, IMG.hero, IMG.sunset], type: "Attractions", icon: Compass, description: "A major family attraction in Santa Rosa with themed rides and attractions ranging from family-friendly experiences to extreme thrills.", tags: ["Family Friendly", "Adventure", "Attractions"], price: 3, verified: true },
  { name: "Seda Nuvali", place: "Santa Rosa, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Hotels", icon: WalletCards, description: "A research-backed hotel stay within Nuvali’s sustainable eco-city setting, close to lakeside, dining, and outdoor spaces.", tags: ["Hotels", "Scenic Views", "Family Friendly"], price: 3, verified: true },
  { name: "Sol Y Viento Hotels and Resorts", place: "Pansol, Calamba, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.sunset], type: "Hotels", icon: WalletCards, description: "A mountain spring resort along the slopes of Mount Makiling, with accommodation, recreation, and dining on site.", tags: ["Hotels", "Relaxation", "Scenic Views"], price: 3, verified: true },
  { name: "Diwata Nature Resort", place: "San Pablo, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.lake, IMG.sunset], type: "Hotels", icon: WalletCards, description: "A curated San Pablo lodging lead for travelers looking for a nature-oriented stay. Verify current details before booking.", tags: ["Hotels", "Nature", "Curated place"], price: 2 },
  { name: "Splash Mountain Resort", place: "Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Hotels", icon: WalletCards, description: "A curated Los Baños resort and hotel lead. Confirm current accommodation, access, and booking details with the venue.", tags: ["Hotels", "Family Friendly", "Curated place"], price: 2 },
  { name: "Dampalit Falls", place: "Los Baños, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Nature", icon: Mountain, description: "A quiet Los Baños waterfall trail lead for travelers looking for a short nature escape. Trail conditions, access, and fees should be confirmed before visiting.", tags: ["Waterfalls", "Nature", "Curated place"], price: 1 },
  { name: "Al Fresco Springs", place: "Brgy Tadlac, Los Baños, Laguna", image: IMG.alFresco, gallery: [IMG.alFresco, IMG.hero, IMG.lake], type: "Hotels", icon: WalletCards, description: "A private hot spring resort group with Al Fresco 1, Al Fresco 2, and Toscana accommodations for group stays. Confirm availability and rates directly with the venue.", tags: ["Hotels", "Hot Springs", "Family Friendly"], price: 3, verified: true },
  { name: "Laresio Lakeside Resort & Spa", place: "Los Baños, Laguna", image: IMG.laresio, gallery: [IMG.laresio, IMG.lake, IMG.hero], type: "Hotels", icon: WalletCards, description: "A lakeside Los Baños escape with private hot spring villas and water-based experiences including cliff diving, slide n' surf, and the blob. Confirm current access and booking details directly.", tags: ["Hotels", "Hot Springs", "Adventure"], price: 3, verified: true },
  { name: "Makiling Botanic Gardens", place: "UPLB Forestry Campus, Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.falls], type: "Nature", icon: Mountain, description: "A UPLB living laboratory and plant museum in the Mount Makiling forest landscape, with endemic and tropical plant collections. Visitor access and current hours should be confirmed with UPLB.", tags: ["Nature", "Science", "Family Friendly"], price: 1, verified: true },
  { name: "UPLB Museum of Natural History", place: "UPLB Campus, Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.hero, IMG.sunset], type: "Attractions", icon: Landmark, description: "An institutional museum showcasing Philippine biodiversity and natural-history collections. Check the museum’s official visitor information before planning a visit.", tags: ["Science", "Education", "Family Friendly"], price: 1, verified: true },
  { name: "UPLB Fertility Tree", place: "UPLB Campus, Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.sunset], type: "Culture", icon: Landmark, description: "A well-known UPLB campus landmark associated with local stories and visitor photo stops. Treat it as a respectful public-campus visit and confirm access rules.", tags: ["Heritage", "Culture", "Campus Walk"], price: 1 },
  { name: "Sining Makiling Gallery", place: "UPLB Campus, Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: Landmark, description: "A UPLB arts and exhibition stop listed in the university’s visitor attractions. Exhibition schedules and access may vary.", tags: ["Arts", "Culture", "Education"], price: 1, verified: true },
  { name: "Makiling Mud Spring", place: "Mount Makiling, Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.falls, IMG.lake], type: "Nature", icon: Mountain, description: "A geothermal feature associated with Mount Makiling’s volcanic landscape. Follow current trail, safety, and access guidance before visiting.", tags: ["Nature", "Geothermal", "Adventure"], price: 1 },
  { name: "Flat Rocks", place: "Mount Makiling, Los Baños, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Nature", icon: Mountain, description: "A natural rock formation and trek stop in the Mount Makiling area. Trail access and conditions should be checked locally before departure.", tags: ["Nature", "Hiking", "Adventure"], price: 1 },
  { name: "IRRI Riceworld Museum", place: "Pili Drive, Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Attractions", icon: Landmark, description: "An educational rice-science and culture stop associated with the International Rice Research Institute. Visitor and experiential-tour access must be arranged through IRRI.", tags: ["Science", "Education", "Culture"], price: 1, verified: true },
  { name: "Philippine Carabao Center at UPLB", place: "UPLB Campus, Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.hero, IMG.sunset], type: "Attractions", icon: Compass, description: "A research and education facility connected with Philippine carabao science and agriculture. Public access and learning visits require confirmation.", tags: ["Science", "Education", "Family Friendly"], price: 1 },
  { name: "Diocesan Shrine of St. Therese of the Child Jesus", place: "UPLB Campus, Batong Malake, Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: Landmark, description: "A church and devotional landmark along Victoria M. Ela Street inside the UPLB area. Visitors should observe worship schedules and site etiquette.", tags: ["Heritage", "Culture", "Spiritual"], price: 1 },
  { name: "San Antonio de Padua Parish", place: "Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: Landmark, description: "A Los Baños parish landmark surfaced in local landmark references. Confirm current mass schedules and visitor access with the parish.", tags: ["Heritage", "Culture", "Spiritual"], price: 1 },
  { name: "Los Baños Municipal Hall & History", place: "Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.sunset, IMG.lake], type: "Culture", icon: Landmark, description: "A civic-history stop for learning about Los Baños’ hot-spring origins, Mount Makiling setting, and local heritage. This is an exterior/history lead rather than a guaranteed tour.", tags: ["Heritage", "History", "Culture"], price: 1, verified: true },
  { name: "Los Baños Public Market", place: "Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Food", icon: Utensils, description: "A community food and everyday-shopping lead for local produce, prepared food, and Laguna pasalubong. Stall selection and operating times vary.", tags: ["Food", "Local Flavors", "Community"], price: 1 },
  { name: "Olivarez Plaza", place: "Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Attractions", icon: Compass, description: "A central public-space lead surfaced in Los Baños landmark references. Confirm current activity, events, and access before visiting.", tags: ["Community", "Culture", "Budget Friendly"], price: 1 },
];
const homeFeaturedDestinationNames = ["Pagsanjan Falls", "Enchanted Kingdom", "Los Baños Hot Springs", "Laresio Lakeside Resort & Spa"];
const homeFeaturedDestinations = homeFeaturedDestinationNames.flatMap(name => destinations.filter(d => d.name === name));
const airbnbLosBanosUrl = "https://www.airbnb.com/s/Los-Banos--Laguna--Philippines/homes";
const localSpots = [
  { name: "Elbi Community Sunday Market", type: "Food market", schedule: "Sundays · 7:00 AM–12:00 PM", place: "Umali Subd., Batong Malake", description: "Fresh produce, prepared food, baked treats, and local makers in a community market setting.", source: "https://www.facebook.com/elbicommunitymarket/" },
  { name: "Elbi Community Night Market", type: "Night market", schedule: "Mondays · 4:00 PM–10:00 PM", place: "Ruby St., Umali Subd., Batong Malake", description: "An evening market lead for food, drinks, and local finds near Los Baños’ community dining spots.", source: "https://www.facebook.com/elbicommunitymarket/" },
];
const bundles = [
  { name: "Laguna Weekend Escape", meta: "2 Days · 1 Night", image: IMG.lake, tags: ["Nature", "Relaxation"], pace: "Easygoing pace", idealFor: "First-time visitors", stops: ["Caliraya Lake", "Pagsanjan Falls", "Los Baños Hot Springs"], route: "East Laguna → South Laguna", description: "A balanced weekend of waterfalls, heritage, and hot springs." },
  { name: "Family Adventure", meta: "1 Day Trip", image: IMG.hero, tags: ["Family", "Adventure"], pace: "Gentle adventure", idealFor: "Families & mixed ages", stops: ["Nuvali Lakeside", "Caliraya Lake", "Local lunch"], route: "Santa Rosa → Lumban", description: "Big views, gentle adventure, and stops that everyone can enjoy." },
  { name: "Food + Culture Tour", meta: "1 Day Trip", image: IMG.sunset, tags: ["Food", "Culture"], pace: "Story-led wandering", idealFor: "Curious foodies", stops: ["Local lunch", "Majayjay Church", "Town heritage stops"], route: "Pagsanjan → Majayjay", description: "A warm day of local plates, stories, and heritage landmarks." },
  { name: "Nature & Relaxation", meta: "2 Days · 1 Night", image: IMG.falls, tags: ["Nature", "Relaxation"], pace: "Slow reset", idealFor: "Couples & quiet seekers", stops: ["Pagsanjan Falls", "Los Baños Hot Springs", "Caliraya Lake"], route: "Pagsanjan → Los Baños", description: "An unhurried reset among green trails and mineral pools." },
  { name: "Hidden Laguna Gems", meta: "1 Day Trip", image: IMG.sunset, tags: ["Hidden Gem", "Adventure"], pace: "Off-the-beaten-path", idealFor: "Repeat Laguna visitors", stops: ["Majayjay Church", "Countryside viewpoints", "Local merienda"], route: "Majayjay → Pila", description: "A quieter route for curious travelers who like the road less taken." },
];
const tripStops = [
  { time: "09:00 AM", name: "Pagsanjan Falls", place: "Pagsanjan, Laguna", image: IMG.falls, tags: ["Nature", "Adventure"], duration: "2 – 3 hrs", price: "₱₱ Moderate", booking: true },
  { time: "12:30 PM", name: "Local Lunch", place: "Pagsanjan, Laguna", image: IMG.hero, tags: ["Food"], duration: "1 – 1.5 hrs", price: "₱₱ Budget-friendly", booking: true },
  { time: "03:00 PM", name: "Majayjay Church", place: "Majayjay, Laguna", image: IMG.sunset, tags: ["Culture"], duration: "30 – 45 mins", price: "Free" },
  { time: "05:00 PM", name: "Los Baños Hot Springs", place: "Los Baños, Laguna", image: IMG.hero, tags: ["Relaxation"], duration: "2 – 3 hrs", price: "₱₱₱ Moderate", booking: true },
  { time: "09:00 AM", name: "Caliraya Lake", place: "Lumban, Laguna", image: IMG.lake, tags: ["Nature", "Scenic Views"], duration: "2 – 3 hrs", price: "₱₱ Moderate", booking: true },
];

function NoticeHost() {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const handler = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setNotice(message);
      window.setTimeout(() => setNotice(""), 2600);
    };
    window.addEventListener("elbiyahe:notice", handler);
    return () => window.removeEventListener("elbiyahe:notice", handler);
  }, []);
  return notice ? <div className="notice" role="status"><Check size={16}/>{notice}</div> : null;
}

const NAV_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Explore", href: "/explore" },
  { label: "Delicacies", href: "/delicacies" },
  { label: "Ride Guide", href: "/ride-guide" },
  { label: "Parking", href: "/parking" },
  { label: "Stay & Eat", href: "/stay-eat" },
  { label: "Bus Tours", href: "/tours" },
  { label: "Passport", href: "/passport" },
];
function Header() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, isAdmin, profile, signOut } = useAuth();
  const initial = (profile?.display_name ?? "?").charAt(0).toUpperCase();
  return <>
    <header className="topbar elbiyahe-topbar">
      <Link href="/" className="brand elbiyahe-brand"><img src={IMG.logoH} alt="El-Biyahe! — Come Curious"/></Link>
      <nav>{NAV_LINKS.map(n => <Link key={n.href} className={location.startsWith(n.href) ? "active" : ""} href={n.href}>{n.label}</Link>)}</nav>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Search" onClick={() => notify("Search across events, places, food, and tours — coming soon.")}><Search size={20}/></button>
        <button className="icon-btn" aria-label="Notifications" onClick={() => notify("You're all caught up.")}><Bell size={20}/></button>
        {isAuthenticated ? (
          <button className="profile-trigger" aria-label="Open account menu" onClick={() => setProfileOpen(v => !v)}><span className="avatar">{initial}</span><ChevronDown size={16}/></button>
        ) : (
          <Link href="/login" className="btn primary" style={{ minHeight: 36, padding: "0 14px" }}>Sign in</Link>
        )}
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={22}/></button>
        {profileOpen && isAuthenticated && (
          <div className="profile-menu">
            <b>{profile?.display_name ?? "Explorer"}</b>
            <Link href="/account" onClick={() => setProfileOpen(false)}>Profile &amp; saved</Link>
            {isAdmin && <Link href="/admin" onClick={() => setProfileOpen(false)}>Admin</Link>}
            <button onClick={() => { setProfileOpen(false); signOut(); notify("Signed out."); }}>Sign out</button>
          </div>
        )}
      </div>
    </header>
    {menuOpen && <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}><div className="mobile-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><b>Come curious</b><button onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20}/></button></div><Link href="/" onClick={() => setMenuOpen(false)}>Home<ChevronRight size={16}/></Link>{NAV_LINKS.map(n => <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}<ChevronRight size={16}/></Link>)}<Link href="/account" onClick={() => setMenuOpen(false)}>Profile<ChevronRight size={16}/></Link></div></div>}
  </>;
}
function ScrollToTop() { const [location] = useLocation(); useEffect(() => { if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [location]); return null; }
function BottomNav() { const [location] = useLocation(); const items=[{href:"/",label:"Home",icon:Compass},{href:"/events",label:"Events",icon:CalendarDays},{href:"/passport",label:"Passport",icon:Ticket},{href:"/explore",label:"Explore",icon:Map},{href:"/account",label:"Profile",icon:Users}]; return <div className="bottom-nav">{items.map(n => {const I=n.icon; const active=n.href==="/"?location==="/":location.startsWith(n.href); return <Link className={active?"active":""} href={n.href} key={n.href}><I size={19}/><span>{n.label}</span></Link>})}</div> }
function Tag({children, tone="sage"}:{children:React.ReactNode;tone?:string}) { return <span className={`tag ${tone}`}>{children}</span> }
function Button({children, variant="primary", href, onClick, type="button", disabled=false}:{children:React.ReactNode;variant?:string;href?:string;onClick?:()=>void;type?:"button"|"submit";disabled?:boolean}) { const cls=`btn ${variant}`; return href ? <Link href={href} className={cls} aria-disabled={disabled}>{children}</Link> : <button type={type} onClick={onClick} className={cls} disabled={disabled}>{children}</button> }
function SectionTitle({eyebrow,title,action}:{eyebrow?:string;title:string;action?:React.ReactNode}) { return <div className="section-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{action && <div className="section-action">{action}</div>}</div> }
function Footer() { return <footer className="site-footer"><div className="container footer-inner"><div className="footer-brand"><Link href="/" className="footer-logo"><img src={IMG.emblem} alt="" style={{width:44,height:44}}/><span>El-Biyahe!<small>Come Curious</small></span></Link><p>Your field companion for discovering the many sides of Los Baños — events, places, flavors, and stories worth collecting.</p></div><nav className="footer-links" aria-label="Footer navigation"><div><b>Discover</b><Link href="/events">Events</Link><Link href="/explore">Explore</Link><Link href="/delicacies">Delicacies</Link><Link href="/tours">Bus Tours</Link></div><div><b>Get around</b><Link href="/ride-guide">Ride Guide</Link><Link href="/parking">Parking</Link><Link href="/stay-eat">Stay &amp; Eat</Link></div><div><b>Your El-Biyahe!</b><Link href="/passport">Digital LB Passport</Link><Link href="/account">Profile</Link></div></nav><div className="footer-bottom"><span>© 2026 El-Biyahe! · Los Baños</span><span>Los Baños is calling.</span></div></div></footer> }
function SaveButton({label="Save"}:{label?:string}) { const [saved,setSaved] = useState(false); return <button className={`save ${saved?"saved":""}`} aria-label={saved?"Remove saved item":label} onClick={(e) => {e.preventDefault();e.stopPropagation();setSaved(v=>!v);notify(saved?"Removed from saved":"Saved for later");}}>{saved?<Heart size={17} fill="currentColor"/>:<Heart size={17}/>}</button> }
function DestinationCard({d, compact=false}:{d:any;compact?:boolean}) { const Icon=d.icon; const href=`/explore/${slugify(d.name)}`; return <article className={`destination-card ${compact?"compact":""}`}><Link href={href} className="image-wrap"><img src={d.image} alt={d.name}/>{d.placeholder&&<Tag tone="ochre">Placeholder listing</Tag>}</Link><SaveButton/><div className="card-body"><div className="card-heading"><Link href={href}><h3>{d.name}</h3></Link><Icon size={16} className="type-icon"/></div><p className="muted"><MapPin size={14}/>{d.place}</p><p className="desc">{d.description}</p><div className="card-footer"><Tag>{d.type}</Tag>{d.rating?<span className="rating"><Star size={14} fill="currentColor"/> {d.rating} <small>({d.reviews})</small></span>:<span className="unrated">Reviews coming soon</span>}</div></div></article> }
function useLandingMotion() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      nodes.forEach(node => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

const QUICK_LINKS = [
  { label: "Events", href: "/events", icon: CalendarDays, live: true },
  { label: "Delicacies", href: "/delicacies", icon: Utensils, live: false },
  { label: "Ride Guide", href: "/ride-guide", icon: Navigation, live: true },
  { label: "Parking", href: "/parking", icon: Car, live: false },
  { label: "Stay & Eat", href: "/stay-eat", icon: Utensils, live: false },
  { label: "Bus Tours", href: "/tours", icon: Ticket, live: true },
  { label: "Explore", href: "/explore", icon: Compass, live: true },
  { label: "Passport", href: "/passport", icon: Landmark, live: true },
];
function Home() {
  useLandingMotion();
  const [email, setEmail] = useState("");
  const { data: events } = useEvents();
  const { data: season } = useCurrentSeason();
  const { data: tours } = useTours();
  const happeningNow = (events ?? []).filter(e => e.status === "live" || e.status === "today").slice(0, 6);
  const featuredTours = (tours ?? []).slice(0, 4);
  return <><Header/><main className="landing-page elbiyahe-home">
    <section className="hero elbiyahe-hero-section" data-scroll-reveal>
      <img className="hero-image hero-scroll-image" src={IMG.hero} alt="Mt. Makiling, Los Baños"/>
      <div className="hero-overlay"/>
      <div className="hero-copy">
        <p className="eyebrow">LOS BAÑOS, LAGUNA</p><h1>What's happening in LB?<br/>Come Curious.</h1><div className="script">Los Baños is calling.</div><div className="accent-rule"/><p>Your field companion for discovering the many sides of Los Baños —<br/>events, places, flavors, and stories worth collecting.</p>
        <div className="hero-actions"><Button href="/events"><CalendarDays size={17}/> Explore Events</Button><Button href="/explore" variant="secondary"><Compass size={17}/> Discover LB</Button></div>
      </div>
    </section>

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
        {happeningNow.length === 0 && <p className="muted" style={{ padding: "8px 0" }}>Nothing live right now — see all upcoming events.</p>}
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
      <div className="destination-grid">{homeFeaturedDestinations.map((d,i)=><div className="scroll-stagger" data-stagger={i} key={d.name}><DestinationCard d={d}/></div>)}</div>
    </section>

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
                <div className="elbiyahe-tour-card-foot"><b>₱{t.price_per_seat.toLocaleString("en-PH")}<small> /seat</small></b><span className="rating"><Star size={13} fill="currentColor"/> {Number(t.rating).toFixed(1)}</span></div>
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
      <div className="mini-map"><div className="map-water"/><div className="map-label one">Calamba City</div><div className="map-label two">Laguna<br/>de Bay</div>{destinations.slice(0,5).map((d,i)=><Link href={`/explore/${slugify(d.name)}`} className={`pin ${["nature","food","culture","stay","gem"][i]}`} style={{left:`${18+i*16}%`,top:`${28+(i%2)*27}%`}} key={d.name}>⌖</Link>)}</div>
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

function Explore() { const [view,setView]=useState("map"); const [query,setQuery]=useState(""); const [category,setCategory]=useState("All Categories"); const [tag,setTag]=useState(""); const [price,setPrice]=useState(4); const [sort,setSort]=useState("Popular"); const [showFilters,setShowFilters]=useState(false); const [visible,setVisible]=useState(4); const categoryMap:any={"Nature & Parks":"Nature","Attractions":"Attractions","Food & Restaurants":"Food","Hotels & Stays":"Hotels","Accommodations":"Hotels","Guides & Tours":"Guides","Culture & Heritage":"Culture","Hidden Gems":"Hidden Gem"}; const filtered=useMemo(()=>destinations.filter(d=>{const matchQuery=`${d.name} ${d.place} ${d.type} ${d.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());const matchCategory=category==="All Categories"||(category==="Accommodations"?d.type==="Hotels"&&d.place.includes("Los Baños"):d.type===categoryMap[category]);const matchTag=!tag||d.tags.includes(tag);return matchQuery&&matchCategory&&matchTag&&d.price<=price}).sort((a,b)=>sort==="Name"?a.name.localeCompare(b.name):(Number(b.rating||0)-Number(a.rating||0))),[query,category,tag,price,sort]); return <><Header/><main className="explore-page"><aside className={`filter-rail ${showFilters?"open":""}`}><div className="rail-title"><h3>Categories</h3><ChevronDown size={15}/></div>{["All Categories","Nature & Parks","Attractions","Food & Restaurants","Hotels & Stays","Accommodations","Guides & Tours","Culture & Heritage","Hidden Gems"].map(x=><button className={category===x?"selected":""} onClick={()=>{setCategory(x);setShowFilters(false)}} key={x}><Compass size={16}/>{x}</button>)}<div className="rail-title spaced"><h3>Tags</h3><ChevronDown size={15}/></div><div className="tag-cloud">{["Family Friendly","Adventure","Budget Friendly","Romantic","Relaxation","Waterfalls","Scenic Views"].map(x=><button className={`tag ${tag===x?"chosen":""}`} onClick={()=>setTag(tag===x?"":x)} key={x}>{x}</button>)}</div><div className="rail-title spaced"><h3>Price Range</h3><ChevronDown size={15}/></div><input aria-label="Maximum price range" className="price-range" type="range" min="1" max="4" value={price} onChange={e=>setPrice(Number(e.target.value))}/><div className="price-labels"><span>₱</span><span>₱₱</span><span>₱₱₱</span><span>₱₱₱₱</span></div></aside><section className="explore-content"><div className="page-heading"><div><h1>Explore Los Baños</h1><p>Nature, food, culture, and hidden gems around town.</p></div><div className="search-row"><div className="searchbox"><Search size={18}/><input aria-label="Search destinations" placeholder="Search destinations, places, or activities..." value={query} onChange={e=>setQuery(e.target.value)}/></div><Button variant="secondary" onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={16}/> Filters</Button><div className="view-toggle">{[["map",Map],["list",List],["grid",Grid2X2]].map(([v,I]:any)=><button className={view===v?"active":""} aria-pressed={view===v} aria-label={`Show ${v} view`} onClick={()=>setView(v)} key={v}><I size={16}/><span>{v}</span></button>)}</div></div></div><div className="explore-quick-filters" aria-label="Browse destination categories">{["All Categories","Nature & Parks","Attractions","Food & Restaurants","Hotels & Stays","Accommodations"].map(x=><button className={category===x?"active":""} onClick={()=>{setCategory(x);setVisible(4);setShowFilters(false)}} key={x}>{x}</button>)}</div><div className={`explore-workspace ${view}`}><div className="result-list"><div className="result-count">{category==="Accommodations"?`${filtered.length} Los Baños stays found`:`${filtered.length} destinations found`} <button onClick={()=>setSort(sort==="Popular"?"Name":"Popular")}>Sort by: <b>{sort}</b>⌄</button></div>{category==="Accommodations"&&<a className="airbnb-result-card" href={airbnbLosBanosUrl} target="_blank" rel="noreferrer"><div><span className="eyebrow">EXTERNAL SEARCH</span><h3>More homes around Los Baños</h3><p>Check live Airbnb availability, dates, prices, amenities, and host details on Airbnb.</p></div><ExternalLink size={17}/></a>}{filtered.slice(0,visible).map(d=><DestinationCard d={d} compact key={d.name}/>)}{visible<filtered.length&&<Button variant="soft" onClick={()=>setVisible(v=>v+3)}>Load more destinations <ChevronDown size={16}/></Button>}{filtered.length===0&&<div className="empty-state"><Search size={25}/><h3>No spots found yet.</h3><p>Try a wider search or clear a filter.</p><Button variant="outline" onClick={()=>{setQuery("");setCategory("All Categories");setTag("");setPrice(4)}}>Clear filters</Button></div>}</div><div className="map-field"><div className="map-copy">Laguna<br/><small>de Bay</small></div>{filtered.map((d,i)=><Link href={`/explore/${slugify(d.name)}`} className={`pin ${["nature","food","culture","stay","gem"][i%5]}`} style={{left:`${15+(i*17)%76}%`,top:`${16+(i*19)%70}%`}} key={d.name}>⌖</Link>)}<div className="map-legend"><b>Categories</b>{[[Mountain,"Nature & Parks"],[Landmark,"Attractions"],[Utensils,"Food & Restaurants"],[WalletCards,"Hotels & Stays"]].map(([I,l]:any)=><span key={l}><I size={16}/>{l}</span>)}</div><Button variant="map-button" onClick={()=>notify("Location access is optional. Showing destinations near you instead.")}><Navigation size={15}/> Show near me</Button></div></div></section></main><BottomNav/></> }

function DestinationDetail({id}:{id?:string}) { const d=destinations.find(x=>slugify(x.name)===id)||destinations[0]; const [photo,setPhoto]=useState(0); const [showAdd,setShowAdd]=useState(false); const gallery=d.gallery||[d.image,IMG.hero,IMG.lake]; return <><Header/><main className="container detail-page"><Link href="/explore" className="back-link"><ArrowLeft size={16}/> Back to Explore</Link><section className="detail-hero"><img src={gallery[photo]} alt={d.name}/><div className="detail-hero-copy"><div><Tag>{d.type}</Tag>{d.placeholder?<Tag tone="ochre">Placeholder listing</Tag>:d.verified?<Tag tone="ochre">Research-backed</Tag>:<Tag tone="ochre">Curated place</Tag>}</div><h1>{d.name}</h1><p className="muted"><MapPin size={16}/> {d.place} {d.rating&&<><span>·</span> <span className="rating"><Star size={15} fill="currentColor"/> {d.rating} ({d.reviews})</span></>}</p></div><SaveButton label="Save destination"/><button className="share-image" aria-label="Share destination" onClick={()=>notify("Destination link copied to clipboard.")}><Share2 size={18}/></button></section><div className="gallery-strip">{gallery.map((image,i)=><button className={i===photo?"active":""} onClick={()=>setPhoto(i)} key={image}><img src={image} alt={`${d.name} view ${i+1}`}/></button>)}</div><div className="detail-layout"><section className="detail-copy"><h2>About</h2><p>{d.description} Experience a place where local stories, fresh air, and a slower pace make room for the moments you remember long after the trip.</p><h2>Details</h2><div className="detail-facts"><span><b>Address</b>{d.place}</span><span><b>Opening hours</b>{d.placeholder?"To be verified":"Check venue before visiting"}</span><span><b>Price range</b>{"₱".repeat(d.price)} · {d.placeholder?"Preview only":"Indicative"}</span><span><b>Recommended duration</b>2–3 hours</span></div><h2>Good for</h2><div>{d.tags.map(t=><Tag key={t}>{t}</Tag>)}</div><div className="location-card"><div className="map-field small-map"><div className="map-copy">{d.name}<br/><small>Laguna</small></div><span className="pin nature">⌖</span></div><Button variant="outline" onClick={()=>notify("Opening map preview for this destination.")}><Map size={15}/> View on Map</Button></div></section><aside className="detail-aside"><div className="side-card action-card"><h2>Make it a trip</h2><Button href="/events"><CalendarDays size={16}/> What's on nearby</Button><Button href="/passport" variant="secondary"><Landmark size={16}/> Passport spots</Button><Button href="/ride-guide" variant="secondary"><Navigation size={16}/> How to get here</Button></div><div className="side-card booking-card"><p className="eyebrow">BOOKING</p><h2>Book directly with the venue.</h2><p>El-Biyahe! links you to the venue's own channel and never processes payment.</p><Button variant="outline ochre" onClick={()=>notify("External booking link ready — this will open the venue site.")}><ExternalLink size={15}/> Book / Reserve</Button></div></aside></div></main><BottomNav/></> }

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) { return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div>{children}</div></div> }
function Account({savedOnly=false}:{savedOnly?:boolean}) {
  const { profile, user, isAuthenticated, isAdmin, signOut, loading } = useAuth();
  const [, navigate] = useLocation();
  if (!loading && !isAuthenticated) { navigate("/login?next=/account"); return null; }
  const name = profile?.display_name ?? "Explorer";
  return <><Header/><main className="container account-page">
    <div className="account-head">
      <div className="large-avatar">{name.charAt(0).toUpperCase()}</div>
      <div><p className="eyebrow">YOUR El-Biyahe!</p><h1>{savedOnly ? "Saved for later" : "Profile"}</h1><p className="muted">{name}{user?.email ? ` · ${user.email}` : ""}</p></div>
      <Button href="/passport"><Sparkles size={16}/> Open Passport</Button>
    </div>
    <div className="account-grid">
      <section className="side-card"><h2><Sparkles size={19}/> Explorer</h2><p className="muted">Level {profile?.explorer_level ?? 1} · {profile?.xp ?? 0} XP</p><Link className="saved-row" href="/passport"><span><b>Digital LB Passport</b><small>Stamp progress &amp; rewards</small></span><ChevronRight size={16}/></Link></section>
      <section className="side-card"><h2><CalendarDays size={19}/> Discover</h2><Link className="saved-row" href="/events"><span><b>Events</b><small>Browse what's on</small></span><ChevronRight size={16}/></Link><Link className="saved-row" href="/tours"><span><b>Bus Tours</b><small>Curated day tours</small></span><ChevronRight size={16}/></Link></section>
    </div>
    <section className="side-card account-preferences">
      <h2>Account</h2>
      {isAdmin && <Link className="saved-row" href="/admin"><span><b>Admin dashboard</b></span><ChevronRight size={16}/></Link>}
      <button className="button outline" onClick={async () => { await signOut(); notify("You are signed out."); navigate("/"); }}>Sign out</button>
    </section>
  </main><Footer/><BottomNav/></>;
}
function NotFound(){return <><Header/><main className="empty-page"><img src={IMG.emblem} alt=""/><h1>That trail is still being mapped.</h1><p>Try one of the routes below.</p><Button href="/">Back home</Button></main><BottomNav/></>}

const elbiShell = { Header, BottomNav, Footer, Button, Tag };
function Router(){return <Switch>
  <Route path="/" component={Home}/>
  <Route path="/events" component={()=><EventsList {...elbiShell}/>}/>
  <Route path="/events/:id" component={({params}:any)=><EventDetail {...elbiShell} id={params?.id}/>}/>
  <Route path="/tours" component={()=><BusTours {...elbiShell}/>}/>
  <Route path="/tours/:id" component={({params}:any)=><TourDetail {...elbiShell} id={params?.id}/>}/>
  <Route path="/passport" component={()=><Passport {...elbiShell}/>}/>
  <Route path="/ride-guide" component={()=><RideGuide {...elbiShell}/>}/>
  <Route path="/delicacies" component={()=><Delicacies {...elbiShell}/>}/>
  <Route path="/parking" component={()=><ComingSoon {...elbiShell} title="Parking"/>}/>
  <Route path="/stay-eat" component={()=><StayEat {...elbiShell}/>}/>
  <Route path="/explore" component={Explore}/>
  <Route path="/explore/:id" component={({params}:any)=><DestinationDetail id={params?.id}/>}/>
  <Route path="/account" component={()=><Account/>}/>
  <Route path="/saved" component={()=><Account savedOnly/>}/>
  <Route path="/login" component={()=><Auth/>}/>
  <Route path="/signup" component={()=><Auth signup/>}/>
  <Route path="/admin" component={()=><RequireAdmin><AdminDashboard/></RequireAdmin>}/>
  <Route path="/admin/events" component={()=><RequireAdmin><AdminEvents/></RequireAdmin>}/>
  <Route path="/admin/tours" component={()=><RequireAdmin><AdminTours/></RequireAdmin>}/>
  <Route path="/admin/passport" component={()=><RequireAdmin><AdminPassport/></RequireAdmin>}/>
  <Route path="/admin/delicacies" component={()=><RequireAdmin><AdminDelicacies/></RequireAdmin>}/>
  <Route path="/admin/accommodations" component={()=><RequireAdmin><AdminAccommodations/></RequireAdmin>}/>
  <Route component={NotFound}/>
</Switch>}
function App(){return <><ScrollToTop/><NoticeHost/><Router/></>}
export default App;

