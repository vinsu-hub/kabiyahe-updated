# Kabiyahe Deep Evaluation — Initial Findings

## Audit scope
This audit compares the current implementation with the supplied reference screens for Home, Explore, Destination Detail, Bundle Detail, Plan a Trip, My Trips, and Trip Itinerary. It also inventories the documented product routes and all visible controls in the current prototype. HTTP smoke tests returned `200` for every requested path because Vite serves the application shell, but only five route patterns are currently declared in `client/src/App.tsx`; undocumented paths therefore fall through to the generic NotFound view rather than representing real screens.

## Route coverage

| Route family | Current result | Severity | Finding |
|---|---|---:|---|
| `/` | Implemented | — | Home view renders and its two primary CTAs route correctly. |
| `/explore` | Implemented | — | Map/list/grid shell renders. |
| `/explore/:destinationId` | Missing | P0 | Destination detail screen from the waterfall reference is not implemented. |
| `/bundles` | Implemented | — | Bundle listing renders. |
| `/bundles/:bundleId` | Missing | P0 | Bundle detail screen with cover hero, overview, included items, tags, and timeline is not implemented. |
| `/plan/new` | Implemented | — | Planner form renders. |
| `/trips` | Implemented | — | My Trips listing renders. |
| `/trips/:tripId` | Implemented | — | Trip itinerary shell renders for any id. |
| `/trips/:tripId/itinerary` | Missing | P1 | The documented nested itinerary route is not declared separately. |
| `/trips/:tripId/wallet` | Missing | P0 | Trip Wallet view is absent. |
| `/trips/:tripId/members` | Missing | P1 | Members/invites/roles view is absent. |
| `/trips/:tripId/polls/:id` | Missing | P1 | Poll detail and voting view is absent. |
| `/account` | Missing | P1 | Account/saved content view is absent. |
| `/login`, `/signup` | Missing | P1 | Authentication views are absent. |

## Control smoke-test matrix

### Header and global navigation

| Control | Current response | Result |
|---|---|---|
| Kabiyahe logo | Routes to `/` | Pass |
| Explore | Routes to `/explore` | Pass |
| Bundles | Routes to `/bundles` | Pass |
| Plan a Trip | Routes to `/plan/new` | Pass |
| My Trips | Routes to `/trips` | Pass |
| Notification bell | No handler or route | Missing response |
| Avatar | Static visual only | Missing response |
| Avatar chevron | Static visual only | Missing response |
| Mobile menu | Static button only | Missing response |
| Mobile bottom Explore / Plan / Trips / Saved | Routes for first three work; `/saved` falls through | Partial |

### Home

| Control | Current response | Result |
|---|---|---|
| Plan My Trip | Routes to `/plan/new` | Pass |
| Explore Laguna | Routes to `/explore` | Pass |
| View all destinations | Routes to `/explore` | Pass |
| Destination save hearts | No handler | Missing response |
| Destination cards | Not clickable | Missing response |
| View all bundles | Routes to `/bundles` | Pass |
| Bundle View Trip buttons | No handler | Missing response |
| Map pins | Decorative spans only | Missing response |
| Explore the Map | Routes to `/explore` | Pass |

### Explore

| Control | Current response | Result |
|---|---|---|
| Search field | Filters the current four-card dataset by name | Pass, limited |
| Filters button | No drawer or state change | Missing response |
| Category buttons | No filtering state | Missing response |
| Tag chips | Static spans | Missing response |
| Price range controls | Decorative only | Missing response |
| Sort by Popular | Static text | Missing response |
| Map/List/Grid toggle | Changes local view state and CSS | Pass, limited |
| Destination save hearts/bookmarks | No handler | Missing response |
| Destination cards | Not linked to detail | Missing response |
| Map pins | Decorative spans only | Missing response |
| Show near me | No geolocation or notice | Missing response |
| Load more destinations | No pagination/state | Missing response |
| Category legend | Informational only | Partial |

### Plan a Trip

| Control | Current response | Result |
|---|---|---|
| Date fields | Visual divs, not editable inputs | Missing response |
| Group minus/plus | No state change | Missing response |
| Budget choices | No selected-state update | Missing response |
| Interest buttons | Toggle selected state | Pass |
| Notes textarea | Editable local field | Pass |
| Back | No navigation | Missing response |
| Next: Review & Generate | No generation/review state | Missing response |
| Summary edit pencil | No handler | Missing response |

### My Trips

| Control | Current response | Result |
|---|---|---|
| New Trip | Routes to `/plan/new` | Pass |
| Filter tabs | Static buttons | Missing response |
| View Itinerary | Routes to `/trips/laguna-weekend` | Pass |
| Bookings | No handler | Missing response |
| Continue Planning / Open Trip | No handler on button itself; visual only | Missing response |
| Trip overflow menus | Not rendered | Missing |
| Right-rail quick actions | Not implemented | Missing |
| Trip Wallet shortcut | Not implemented | Missing |

### Trip Itinerary

| Control | Current response | Result |
|---|---|---|
| Share | No handler or share fallback | Missing response |
| Edit Trip | No handler | Missing response |
| Itinerary / Map / Wallet / Members tabs | Static buttons | Missing response |
| Add Stop | No modal or route | Missing response |
| Navigate | No outbound maps action | Missing response |
| Booking | No external-link behavior or notice | Missing response |
| Stop overflow | Static button | Missing response |
| Optimize Route | No handler | Missing response |
| Auto Estimate Costs | No handler | Missing response |
| Duplicate Itinerary | No handler | Missing response |
| Clear Itinerary | No handler or confirmation | Missing response |
| Add New Day | No state change | Missing response |
| Travel Note pencil | No handler | Missing response |

## Fidelity comparison

### Home
The implementation is visually close in palette, editorial typography, hero composition, scenic imagery, card treatment, and hierarchy. It differs from the reference in several noticeable ways: the reference uses a floating rounded header over the hero, more Filipino illustrated edge motifs, a curved transition into the content, more compact destination cards, a richer map preview, and a more illustrated three-step footer. The current version has a conventional sticky header and flatter section transitions.

### Explore
The desktop split between filter rail, destination list, and map is correctly represented, and the warm cream/green visual language is consistent. The map is a stylized placeholder rather than the geographic Laguna map shown in the reference. The reference also has more destination metadata, category-specific marker icons, a fuller filter rail, and stronger list-card proportions. Mobile behavior is structurally sound, but map/list/grid remains a presentation toggle without true data-view semantics.

### Destination Detail
The entire reference view is missing. This is a P0 fidelity and navigation gap because Home and Explore visually imply destination detail but cannot reach it.

### Bundle Detail
The entire reference view is missing. The current bundle listing cannot open the detailed timeline/overview screen shown in the reference.

### Plan a Trip
The visual hierarchy is close and the mobile stacking is practical. The reference includes a more illustrative left-side scene, a richer stepper, genuinely editable date/group/budget controls, a populated summary that updates from the form, trust/verification footer blocks, and a working review/generate progression. The current version is a polished static form prototype with only interest toggles and notes being stateful.

### My Trips
The current trip cards and imagery are close to the reference, including progress bars and action rows. It is missing the reference right rail containing Trip Summary, Quick Actions, Trip Wallet card, and Helpful Tip. Tabs are static, card actions are incomplete, and there is no archived/completed filtering behavior.

### Trip Itinerary
The newly supplied screen is represented well at a structural level: title header, trip metadata, tabs, day groups, timeline dots, stop cards, booking/navigation actions, and utility rail. Key differences are missing responsive/mobile semantics for tab navigation state, absent interactions, no map/wallet/member subviews, no drag-and-drop, and missing confirmations for destructive actions. Some reference imagery and supporting illustrations are also approximated rather than dedicated per-stop assets.

## Prioritized remediation

| Priority | Workstream | Why it matters |
|---|---|---|
| P0 | Add Destination Detail and Bundle Detail routes and screens | Restores core navigation implied by the reference and product sitemap. |
| P0 | Make all primary CTAs stateful or navigational | Prevents dead-end interactions across the primary user journey. |
| P0 | Add trip subviews for Wallet, Members, and Polls | These are core MVP surfaces in the supplied product context. |
| P1 | Add real filter, sort, save, view, and list-pin behavior | Makes Explore functionally consistent with its visual promise. |
| P1 | Make planner fields and review/generate flow interactive | Converts the planner from a static mock to a testable journey. |
| P1 | Add My Trips right rail, tabs, actions, and overflow menus | Closes the gap between the reference dashboard and current implementation. |
| P1 | Add Share, Navigate, Booking, Add Stop, Edit, Duplicate, and Clear responses | Covers the detailed itinerary’s high-frequency trip-day actions. |
| P2 | Replace placeholder map with geographic Laguna rendering | Improves visual fidelity and discovery usefulness. |
| P2 | Add dedicated illustrations, curved section motifs, and richer mobile details | Moves the experience closer to the reference’s distinctive brand craft. |

## Visual evidence from fallback-route capture
The eight captured missing-route paths all rendered the same generic “That trail is still being mapped” page with only the global header and Back home control. This confirms the gaps are not merely incomplete metadata; the referenced Destination Detail, Bundle Detail, Wallet, Members, Account, and Auth experiences are absent from the running application. The `/trips/:tripId/itinerary` path also falls through even though `/trips/:id` works, so the implementation needs explicit nested-route handling or a redirect strategy.

## Control-by-control remediation plan

The fixes should be delivered in vertical slices so every visible action either completes a meaningful local response or routes to a real view. Each slice should include a desktop and mobile smoke test plus an explicit acceptance condition.

| Slice | Controls and views | Implementation response | Acceptance test |
|---|---|---|---|
| 1. Navigation foundation | `/explore/:destinationId`, `/bundles/:bundleId`, nested trip routes, `/account`, `/login`, `/signup`, `/saved` | Add route components and a route registry. Add stable slugs to destination and bundle data. Make card titles, images, and primary actions real links. Redirect `/trips/:id/itinerary` to the canonical trip route or render a dedicated itinerary view. | Every sitemap URL renders a purposeful screen, not the fallback. Browser back/forward preserves route state. |
| 2. Global chrome | Bell, avatar, chevron, mobile menu, Saved tab | Add notification popover, account menu, and mobile drawer. Implement `/saved` with saved destinations/bundles empty and populated states. | Each header control opens or navigates; Escape closes overlays; mobile menu is reachable and dismissible. |
| 3. Home discovery | Destination cards, hearts/bookmarks, bundle cards/View Trip, map pins | Make cards route to destination/bundle detail. Add local saved state with active icon styling and toast. Make map pins clickable and focus the matching destination preview. | A tap on any card, pin, save icon, or View Trip causes a visible state change or route transition. |
| 4. Explore controls | Filters, category buttons, tag chips, price range, sort, map/list/grid, near-me, load more | Use a filter drawer on mobile and a rail on desktop. Centralize derived filtering state. Convert price range to a controlled range input. Add sort options and a finite load-more cursor. Use category-aware marker buttons. For near-me, show a permission-aware notice and use a safe fallback when geolocation is denied. | Search, filters, sort, price, and view toggles produce consistent result counts and card sets across desktop/mobile. |
| 5. Destination detail | Back, gallery, save, share, View on Map, Add to Trip, external booking | Build detail page from destination data. Use a gallery lightbox or selectable thumbnails, native share with clipboard fallback, add-to-trip dialog, and `target="_blank" rel="noreferrer"` with an external-booking disclosure. | All reference actions are reachable, announce their result, and never imply Kabiyahe processes payment. |
| 6. Bundles | Filter pills, View Trip, Clone, stop links | Build bundle detail with cover hero, tags, cost/duration, day timeline, and clone dialog. Clone should create a local trip draft or route to planner review without mutating the source. | Filters update cards; View Trip opens detail; Clone produces a new editable trip identity. |
| 7. Planner | Dates, group counter, budget, interests, notes, Back, Review/Generate, edit pencil | Replace visual date divs with controlled inputs. Clamp group size. Make budget single-select and summary reactive. Add review step and a deterministic local generation result using only the curated destination dataset until backend RAG is connected. | Every field updates summary; invalid dates are rejected; Next advances; Back returns; Generate produces a review/result state. |
| 8. My Trips | Filter tabs, View Itinerary, Bookings, Continue/Open, overflow, wallet shortcut, right rail | Add tab state and filtered datasets. Add trip detail navigation, wallet deep-link, invite/share action, and contextual overflow menu. Build the missing right rail to match the reference. | Tabs alter visible trips; every card action navigates or opens a menu; right-rail quick actions are not decorative. |
| 9. Trip itinerary | Tabs, Share, Edit, Add Stop, Navigate, Booking, overflow, Optimize, Estimate, Duplicate, Clear, Add Day, Travel Note | Wire tabs to `/map`, `/wallet`, `/members`; add dialogs for edit, add-stop, duplicate, and clear confirmation. Navigate opens a maps URL. Booking uses external disclosure. Optimize and estimate update local itinerary metadata. Add-day appends a new empty day. Travel Note becomes editable. | Every button has a visible success, confirmation, navigation, or error response; destructive Clear requires confirmation. |
| 10. Trip supporting views | Wallet, Members, Poll detail | Build the MVP surfaces described in the supplied product specification: per-stop booking cards, member roles/invites, and poll options/deadline/results. Keep entries local until persistence is enabled. | Deep links work, privacy state is explicit, and empty/loading/error states exist. |
| 11. Fidelity pass | All reference screens | Replace generic fallback-only areas with the supplied information architecture. Add floating/rounded header behavior, map-line motifs, illustration accents, reference-accurate section spacing, dedicated per-stop imagery, and mobile sticky action treatment. | Visual review at 1280px and 390px shows consistent hierarchy, contrast, spacing, and control placement against each supplied reference. |
| 12. Regression pass | Entire application | Add a route/control smoke checklist and run it after each slice. Check console logs, TypeScript, keyboard focus, Escape behavior, external links, and reduced-motion behavior. | No dead primary control remains; no documented route falls through unintentionally; no console errors are introduced.

## Recommended execution order

The highest-value sequence is **Navigation foundation → Home/Explore discovery → Destination and Bundle detail → Planner interaction → My Trips and Trip itinerary actions → Wallet/Members/Polls → final fidelity refinement**. This order repairs the broken navigation graph first, then turns visible surfaces into testable journeys, and only then expands the supporting MVP views.

## Explicit limitations to keep visible during implementation

The current prototype is static and local-state based. It should not imply real authentication, collaboration, booking verification, payments, or AI grounding until those services are connected. External booking actions must clearly disclose that the user is leaving Kabiyahe, and the wallet must remain a private reference store rather than a payment surface.
