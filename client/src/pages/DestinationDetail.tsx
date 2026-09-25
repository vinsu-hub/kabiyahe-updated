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


// Attribution for the Wikimedia Commons destination photos (see
// scripts/destination-photo-manifest.json). Shown under the gallery on the
// destination detail page; generic Laguna stock images carry no credit line.
const PHOTO_CREDITS: Record<string, string> = {
  "/assets/elbiyahe-pagsanjan-falls.jpg": "Andrew Martin, CC BY 3.0, via Wikimedia Commons",
  "/assets/elbiyahe-caliraya-lake.jpg": "Maestrocuerdo, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-majayjay-church.jpg": "Ralff Nestor Nacor, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-los-banos-hot-springs.jpg": "Ramon FVelasquez, CC BY-SA 3.0, via Wikimedia Commons",
  "/assets/elbiyahe-nuvali-lakeside.jpg": "RioHondo, CC BY-SA 3.0, via Wikimedia Commons",
  "/assets/elbiyahe-rizal-shrine.jpg": "RaywollesenFortes, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-seven-crater-lakes.jpg": "Patrickroque01, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-mount-makiling.jpg": "Florante A. Cruz, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-makiling-trail.jpg": "Twentyone-ways-to, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-makiling-mud-spring.jpg": "Andrew Martin, CC BY 3.0, via Wikimedia Commons",
  "/assets/elbiyahe-paete-church.jpg": "Carlo Joseph Moskito, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-enchanted-kingdom.jpg": "LMP 2001, public domain, via Wikimedia Commons",
  "/assets/elbiyahe-makiling-botanic-gardens.jpg": "A.C.T. Alejandre, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-uplb-mnh.jpg": "Florante A. Cruz, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-uplb-fertility-tree.jpg": "Ralff Nestor Nacor, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-uplb-campus.jpg": "Patrick Roque, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-riceworld-museum.jpg": "IRRI, CC BY 2.0, via Wikimedia Commons",
  "/assets/elbiyahe-st-therese-church.jpg": "Julia Sumangil, CC BY 2.0, via Wikimedia Commons",
  "/assets/elbiyahe-san-antonio-parish.jpg": "Elmer B. Domingo, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-los-banos-municipal-hall.jpg": "Ralff Nestor Nacor, CC BY-SA 4.0, via Wikimedia Commons",
  "/assets/elbiyahe-los-banos-public-market.jpg": "Ralff Nestor Nacor, CC BY-SA 4.0, via Wikimedia Commons",
};



export function DestinationDetail({id}:{id?:string}) {
  const { data: d, isLoading, error } = useDestination(id);
  const [photo,setPhoto]=useState(0);
  if (isLoading) return <><Header/><main className="container detail-page"><Loading/></main><BottomNav/></>;
  if (error || !d) return <><Header/><main className="container detail-page"><div className="empty-state"><Compass size={24}/><h3>Couldn't find that destination.</h3><Button href="/explore">Back to Explore</Button></div></main><BottomNav/></>;
  const gallery = d.gallery.length ? d.gallery : [d.hero_image || IMG.hero];
  return <><Header/><main className="container detail-page"><Link href="/explore" className="back-link"><ArrowLeft size={16}/> Back to Explore</Link><section className="detail-hero"><img src={gallery[photo]} alt={d.name}/><div className="detail-hero-copy"><div><Tag>{d.type}</Tag>{d.placeholder?<Tag tone="ochre">Placeholder listing</Tag>:d.verified?<Tag tone="ochre">Research-backed</Tag>:<Tag tone="ochre">Curated place</Tag>}</div><h1>{d.name}</h1><p className="muted"><MapPin size={16}/> {d.place} {d.rating != null && <><span>·</span> <Rating value={d.rating} count={d.review_count}/></>}</p></div><SaveButton label="Save destination"/><button className="share-image" aria-label="Share destination" onClick={()=>notify("Destination link copied to clipboard.")}><Share2 size={18}/></button></section><div className="gallery-strip">{gallery.map((image,i)=><button className={i===photo?"active":""} onClick={()=>setPhoto(i)} key={image}><img src={image} alt={`${d.name} view ${i+1}`}/></button>)}</div>{PHOTO_CREDITS[gallery[photo]]&&<p className="muted" style={{fontSize:12,marginTop:6}}>Photo: {PHOTO_CREDITS[gallery[photo]]}</p>}<div className="detail-layout"><section className="detail-copy"><h2>About</h2><p>{d.description} Experience a place where local stories, fresh air, and a slower pace make room for the moments you remember long after the trip.</p><h2>Details</h2><div className="detail-facts"><span><b>Address</b>{d.place}</span><span><b>Opening hours</b>{d.placeholder?"To be verified":"Check venue before visiting"}</span><span><b>Price range</b>{"₱".repeat(d.price_tier)} · {d.placeholder?"Preview only":"Indicative"}</span><span><b>Recommended duration</b>2–3 hours</span></div><h2>Good for</h2><div>{d.tags.map(t=><Tag key={t}>{t}</Tag>)}</div><div className="location-card">{d.lat != null && d.lng != null
  ? <><MapView points={[{ id: d.id, lat: d.lat, lng: d.lng, name: d.name, kind: d.type, sub: d.place ?? undefined }]} interactive={false} height={220} ariaLabel={`Map showing ${d.name}`}/><Button variant="outline" onClick={() => window.open(directionsUrl(d.lat!, d.lng!), "_blank", "noopener")}><Navigation size={15}/> Get directions</Button></>
  : <p className="muted">Location pin coming soon for this place.</p>}</div></section><aside className="detail-aside"><div className="side-card action-card"><h2>Make it a trip</h2><Button href="/events"><CalendarDays size={16}/> What's on nearby</Button><Button href="/passport" variant="secondary"><Landmark size={16}/> Passport spots</Button><Button href="/ride-guide" variant="secondary"><Navigation size={16}/> How to get here</Button></div><div className="side-card booking-card"><p className="eyebrow">BOOKING</p><h2>Book directly with the venue.</h2><p>El-Biyahe! links you to the venue's own channel and never processes payment.</p><Button variant="outline ochre" onClick={()=>notify("External booking link ready — this will open the venue site.")}><ExternalLink size={15}/> Book / Reserve</Button></div></aside></div></main><BottomNav/></> }
