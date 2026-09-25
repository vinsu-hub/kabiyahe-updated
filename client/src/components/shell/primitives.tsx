import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Heart, MapPin, Star } from "lucide-react";
import { SkylineMotif } from "./SkylineMotif";
import "./shell.css";

/** Image and copy hero; actions and the optional right card are caller supplied. */
export function PageHero({ eyebrow, title, subtitle, body, image, imageAlt = "", actions, rightCard, className = "" }: { eyebrow?: string; title: string; subtitle?: string; body?: string; image?: string; imageAlt?: string; actions?: ReactNode; rightCard?: ReactNode; className?: string }) {
  return <section className={`shell-page-hero ${className}`}>
    {image && <img className="shell-page-hero-image" src={image} alt={imageAlt} />}
    <div className="shell-page-hero-copy">{eyebrow && <p className="shell-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p className="script-accent shell-hero-subtitle">{subtitle}</p>}{body && <p className="shell-hero-body">{body}</p>}{actions && <div className="shell-hero-actions">{actions}</div>}</div>
    {rightCard && <div className="shell-page-hero-card">{rightCard}</div>}
  </section>;
}

/** Responsive filter rail with a caller supplied title and controls. */
export function FilterSidebar({ title = "Filters", children, className = "" }: { title?: string; children: ReactNode; className?: string }) { return <aside className={`shell-filter-sidebar ${className}`}><h2>{title}</h2>{children}</aside>; }

/** Right rail panel with an optional linked collection action. */
export function RightRailCard({ title, seeAllHref, children, className = "" }: { title: string; seeAllHref?: string; children: ReactNode; className?: string }) { return <aside className={`shell-right-rail-card ${className}`}><div className="shell-card-head"><h2>{title}</h2>{seeAllHref && <Link href={seeAllHref}>See all <ArrowRight size={15} /></Link>}</div>{children}</aside>; }

/** Passport promotion; artwork can be passed in when available. */
export function PassportPromoCard({ href = "/passport", illustration, body = "Explore Los Baños with your LB Passport and earn rewards along the way." }: { href?: string; illustration?: ReactNode; body?: string }) { return <aside className="shell-passport-promo"><div><p className="script-accent">Collect. Eat. Earn!</p><span>{body}</span><Link href={href}>Learn more <ArrowRight size={15} /></Link></div>{illustration && <div className="shell-passport-art">{illustration}</div>}</aside>; }

/** A factual value band; callers provide labels and icons. */
export function CommunityStrip({ items }: { items: { icon: ReactNode; label: string; detail?: string }[] }) { return <section className="shell-community-strip" aria-label="Community values">{items.map(item => <div key={item.label}><span>{item.icon}</span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div>)}</section>; }

/** The existing skyline motif within a narrow decorative band. */
export function SkylineBand({ className = "" }: { className?: string }) { return <div className={`shell-skyline-band ${className}`} aria-hidden="true"><SkylineMotif /></div>; }

/** Data backed listing card; rating and distance appear only when provided. */
export function ListingCard({ title, href, image, imageAlt = "", badge, meta, rating, distance, saved, onSave }: { title: string; href: string; image?: string; imageAlt?: string; badge?: ReactNode; meta?: ReactNode; rating?: number | null; distance?: string; saved?: boolean; onSave?: () => void }) { return <article className="shell-listing-card"><div className="shell-listing-media"><Link href={href}>{image && <img src={image} alt={imageAlt || title} />}</Link>{badge && <span className="shell-listing-badge">{badge}</span>}{onSave && <button type="button" onClick={onSave} aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button>}</div><div className="shell-listing-body"><Link href={href}><h3>{title}</h3></Link>{meta && <p>{meta}</p>}<div className="shell-listing-facts">{rating != null && <span><Star size={14} fill="currentColor" />{rating.toFixed(1)}</span>}{distance && <span><MapPin size={14} />{distance}</span>}</div></div></article>; }

/** Label and value pair for real metrics supplied by the page. */
export function StatTile({ label, value, icon, detail }: { label: string; value: string | number; icon?: ReactNode; detail?: string }) { return <div className="shell-stat-tile">{icon}<strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div>; }

/** Single or multi select chip controls; page state stays with the caller. */
export function ChipGroup<T extends string>({ label, options, selected, onChange }: { label?: string; options: readonly T[]; selected: T | readonly T[]; onChange: (value: T) => void }) { const active = Array.isArray(selected) ? selected as readonly T[] : [selected as T]; return <div className="shell-chip-group" role="group" aria-label={label}>{label && <strong>{label}</strong>}<div>{options.map(option => <button key={option} type="button" className={active.includes(option) ? "active" : ""} aria-pressed={active.includes(option)} onClick={() => onChange(option)}>{option}</button>)}</div></div>; }
