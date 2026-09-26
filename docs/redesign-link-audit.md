# Redesign entry-point audit

Reference: `5f3453f:client/src/App.tsx` and `5f3453f:client/src/pages/ElbiyaheFeatures.tsx`, compared with current extracted pages, the route table, and shared shell. Repeated links are grouped by user journey; a route remaining registered alone does not count as a discoverable entry point.

## Restored

| Previous entry point | Redesign gap | Resolution |
| --- | --- | --- |
| Explore → `/heritage-walk`, “Los Baños Heritage Walk”, 17 historic stops | Entire callout disappeared | Always-visible Explore banner: **Los Baños Heritage Walk: 17 stops**, using `conceptImages.toursHeritageChurch` and shared Button; added **Heritage Walk** in footer Discover. Neither depends on destination data loading successfully. |
| Home “What do you need?” → `/parking` | Parking quick tile disappeared | Restored Parking quick tile. Coordinator explicitly approved the small Home edit. |
| Home “What do you need?” → `/tours` | Bus Tours quick tile disappeared | Restored Bus Tours quick tile. Coordinator explicitly approved the small Home edit. |
| Explore category controls: Hotels & Stays, Accommodations, Guides & Tours, Hidden Gems | These types could no longer be chosen | Restored in the Filters category selector. Accommodations preserves the old Hotels + Los Baños place filter. Existing category chips remain. |
| Explore destination Save action | New ListingCard callers omitted the Save control | Restored optional ListingCard save action, preserving the old local toggle and notice behavior (no invented persistence). |
| Explore empty results → Clear filters | Reset button disappeared | Restored query/category/tag/price reset in the empty-results state. |

Heritage Walk also now uses shared PageHero with concept artwork and scoped page CSS. Added Back to Explore and a truthful empty-stops state. Its four existing “Make it a trip” links remain available when trail data is unavailable: `/passport`, `/ride-guide`, `/delicacies`, `/explore`. Query, map numbering, route line, era grouping, and directions behavior are unchanged.

## Retained or relocated internal links

| Prior links and entry points | Current location |
| --- | --- |
| `/`, `/events`, `/explore`, `/delicacies`, `/ride-guide`, `/parking`, `/stay-eat`, `/tours`, `/passport`, `/account` | Header, mobile drawer, footer, bottom navigation, and Home quick links preserve these journeys. |
| Home hero and season → `/events`; happening cards → `/events/${slug}` | Home hero, season card/calendar links, and real event cards. |
| Home “Places to explore” → `/explore` and `/explore/${slug}`; map preview → `/explore` | Home Start Exploring/Explore LB and Explore listing/map links. The homepage destination preview is consolidated into Explore. |
| Home featured tours → `/tours` and `/tours/${slug}` | Restored Home Bus Tours quick tile, shared navigation, and Bus Tours real listing cards. |
| Event cards, featured event RSVP/details, event map markers → `/events/${slug}` | Events list/cards/map and EventDetail. |
| Event detail → `/events`, `/stay-eat` (Eat/Stay Nearby), `/ride-guide`, `/explore`, `/passport` | Event breadcrumb, Complete Your Visit tiles, transport panel, Passport stops/teaser. |
| Heritage event detail → `/heritage-walk`, “See the full 17-stop trail” | Preserved conditional section for `los-banos-heritage-walk` in EventDetail. |
| Bus Tours Heritage Day guide → `/heritage-walk` | Preserved in BusTours `TOUR_GUIDES`. |
| Tour cards/featured CTAs → `/tours/${slug}`; tour detail back → `/tours`; tour Passport teaser → `/passport` | BusTours and TourDetail retain these links. |
| Ride Guide View Full Map → `/explore`, Passport Learn More → `/passport` | View Full Map retained; shared PassportPromoCard retains its default `/passport` destination. No duplicate CTA was needed. |
| Delicacies and Stay & Eat Open Passport → `/passport` | Existing page promotional cards. |
| Destination card/map → `/explore/${slug}`; detail back/error recovery → `/explore`; nearby actions → `/events`, `/passport`, `/ride-guide` | Explore ListingCard/map/list and DestinationDetail. |
| Account empty saved list → `/explore`; stamp progress → `/passport`; discover → `/events`, `/tours`; conditional admin → `/admin` | Account retains these entries. |
| `/saved` route; account/saved unauthenticated redirects → `/login?next=/account` or `/login?next=/saved` | Routes and Account authentication redirects retained. The old shell used “Profile & saved” → `/account`, not a separate `/saved` navigation link. |
| Header Sign in → `/login`; event/tour/Passport/delicacy/stay actions → `/login?next=...` | Existing sign-in links and action redirects remain. |
| NotFound recovery → `/`, `/events`, `/explore`, `/delicacies`, `/ride-guide`, `/passport` | NotFound links retained. |
| Admin routes and `/signup` | Route table retained; Auth and admin shell remain outside the redesigned public-page changes. No route removed by this work. |

Ride Guide anchor entry points (`#jeepney-routes`, `#tricycle-fare-guide`, `#local-tips`, `#terminal-guide`) and Parking report-issue action remain. RSVP, reservation, Passport scan/sign-in/claim, delicacy suggestion, accommodation reservation, feedback, newsletter, share, and navigation actions remain in their extracted pages.

## Intentionally dropped presentation duplicates

- Home's separate “Places to explore,” “Featured Bus Tours,” and mini-map preview sections are consolidated into the redesigned Explore discovery flow and Bus Tours route. Their destinations are retained; the Home Bus Tours shortcut is restored above.
- Explore's old separate grid-view switch is replaced by the permanent Discover LB card grid plus map/list switch. No destination detail route is lost.
- Old static local-spots editorial highlights and their external source links, and Home's external Airbnb teaser, are absent from the redesigned Home. These are outside the internal-route audit; the existing Explore Filters Airbnb handoff remains. No live availability or replacement listing data was invented.
- Old map-key presentation and automatic “In Los Baños / Nearby Laguna day trips” group headings are superseded by the new map/category/discovery layout; destinations remain reachable via the same detail routes.

## Validation

- `pnpm install` completed before implementation.
- `pnpm check` and `pnpm build` passed (build reports the existing large-chunk advisory).
- Local Playwright/Chrome checks at **1440 × 900** and **390 × 900**: Heritage Walk and Explore render with their expected headings, zero document horizontal overflow, and no uncaught page errors. Explore has both banner and footer `/heritage-walk` links; Heritage Walk renders inside shared header/footer/mobile navigation.
- Screenshots inspected at both sizes; page-local hero text, footer links, and trip links fit. Local requests only: all external requests were blocked, and no production Supabase connection or fake stop data was used.
- Local-only intercepted empty (`[]`) and 503 responses confirm Heritage Walk empty/error states at both widths with zero horizontal overflow and all four trip links available. The restored category options are selectable, and the Explore banner click navigates to `/heritage-walk`.
- With no configured backend, the live 17-stop dataset/map cannot be verified. The data-dependent map/list logic is preserved, with scoped wrapping and mobile map-height rules; loading/error/empty rendering is checked locally.
