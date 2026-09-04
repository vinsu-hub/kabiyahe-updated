# Kabiyahe Deep Audit Checklist

## Reference fidelity
- [x] Compare Home against the supplied landing-page reference.
- [x] Compare Explore against the supplied map/list reference.
- [x] Compare Destination Detail against the supplied Pagsanjan Falls reference.
- [x] Compare Bundle Detail against the supplied bundle reference.
- [x] Compare Plan a Trip against the supplied form reference.
- [x] Compare My Trips against the supplied dashboard reference.
- [x] Compare Trip Itinerary against the newly supplied itinerary reference.
- [x] Check desktop and mobile hierarchy, spacing, typography, imagery, and responsive transformations.

## Route coverage
- [x] Verify `/`.
- [x] Verify `/explore`.
- [x] Implement and verify `/explore/:destinationId`.
- [x] Verify `/bundles`.
- [x] Implement and verify `/bundles/:bundleId`.
- [x] Verify `/plan/new`.
- [x] Verify `/trips`.
- [x] Verify `/trips/:tripId`.
- [x] Implement and verify `/trips/:tripId/itinerary`.
- [x] Implement and verify `/trips/:tripId/wallet`.
- [x] Implement and verify `/trips/:tripId/members`.
- [x] Implement and verify `/trips/:tripId/polls/:id`.
- [x] Implement and verify `/account`.
- [x] Implement and verify `/login` and `/signup`.
- [x] Implement and verify `/saved`.

## Interaction smoke tests
- [x] Wire every header navigation item and global overlay.
- [x] Wire every Home card, save control, map pin, and bundle action.
- [x] Wire Explore filters, sort, pins, cards, save, near-me, and load-more.
- [x] Wire planner fields, review/generate, and summary editing.
- [x] Wire My Trips tabs, card actions, quick actions, and overflow.
- [x] Wire Trip Itinerary tabs, actions, dialogs, and note editing.
- [x] Wire Wallet, Members, Poll, Account, Saved, Login, and Signup states.

### Regression checklist
- [x] Verify every header navigation item.
- [x] Verify header notification, avatar, dropdown, and mobile menu controls.
- [x] Verify every Home CTA, card, save control, map preview control, and bundle control.
- [x] Verify Explore search, filters, category buttons, tags, price controls, sort control, view toggles, map pins, list cards, save controls, and load-more control.
- [x] Verify Destination Detail back, save, share, gallery, map, booking, add-to-trip, and create-trip controls.
- [x] Verify Bundles filters, cards, view-trip controls, clone controls, and itinerary stop links.
- [x] Verify Plan date fields, group counter, budget selectors, interest selectors, notes field, back, review/generate, edit, and summary interactions.
- [x] Verify My Trips tabs, new trip, card actions, continue/open trip, bookings, invite, trip wallet, and overflow menus.
- [x] Verify Trip Itinerary tabs, share/edit, add stop, navigate, booking, overflow, overview actions, add new day, helpful tip, and travel note controls.
- [x] Record every visible control with no response, incorrect route, or placeholder response.

## Evidence and output
- [x] Capture representative desktop screenshots.
- [x] Capture representative mobile screenshots.
- [x] Check browser and dev-server logs.
- [x] Produce a severity-ranked gap table.
- [x] Produce an implementation plan for each missing or broken response.

## My Trips focused evaluation
- [x] Verify My Trips desktop layout against the supplied reference.
- [x] Verify My Trips mobile layout and bottom navigation.
- [x] Verify All Trips, Upcoming, Active, Completed, and Archived filters.
- [x] Verify New Trip navigation.
- [x] Verify each trip card title/edit affordance.
- [x] Verify View Itinerary for each trip card.
- [x] Verify Bookings for each trip card.
- [x] Verify Continue Planning / Open Trip responses.
- [x] Check for missing quick actions, invite action, wallet summary, and overflow menu.
- [x] Record remaining gaps and apply targeted fixes.

## Full animation implementation and validation
- [x] Define shared motion tokens, easing, duration, and reduced-motion rules.
- [x] Add page entrance transitions across every route.
- [x] Add card hover, press, stagger, image, and progress animations.
- [x] Add nav, tab, filter, view-toggle, map-pin, and bottom-nav transitions.
- [x] Add drawer, modal, toast, menu, form-step, poll, wallet, and itinerary action transitions.
- [x] Validate all implemented routes at desktop and mobile breakpoints.
- [x] Validate prefers-reduced-motion behavior.
- [x] Check animation-related console errors and production build.

## Partner Portal implementation
- [x] Define separate `/partners` information architecture, visual treatment, roles, and access states.
- [x] Enable full-stack auth, database, backend procedures, and file storage foundation with partner realm wiring.
- [x] Add partner join landing page and pending-verification registration flow with photo upload and map interaction.
- [x] Add partner dashboard listing management, preview, metrics, visibility tier, and account settings with live queries and persistence actions.
- [x] Add admin partner queue, filters, review actions, live queue query, and persisted audit-log query surface.
- [x] Add unclaimed-listing claim flow with server-side record linkage and duplicate-prevention messaging.
- [x] Add partner permissions for pending, active, and admin states with page-level and API role gates.
- [x] Validate partner portal routes on desktop and mobile.
- [x] Validate partner access-control gates with tests; full persistence and direct-route verification remain pending live-user verification.
- [x] Save and deliver the Partner Portal implementation.

## Partner Portal gap remediation
- [x] Implement partner photo upload using the project storage stack and persist uploaded files to partner records.
- [x] Add interactive map pin placement/geolocation fields to partner registration and persist listing coordinates.
- [x] Wire Partner Dashboard listing editor, contact settings, metrics ranges, and visibility requests to tRPC queries/mutations.
- [x] Connect Admin Queue and Audit Log UI to persisted tRPC data, with local preview fallback when no admin session exists.
- [x] Wire the claim screen to the server-side claim mutation and real unclaimed destination records.
- [x] Protect Partner Portal private routes by authenticated partner/admin role checks.
- [x] Add route/API tests for anonymous, traveler, partner, and admin access boundaries.

## Final Partner Portal gap remediation
- [x] Wire admin approve/info-request actions to persisted review mutations and refresh queue/log data.
- [x] Bind visibility tier and performance chart content to live partner and metrics data with loading/error states.
- [x] Enforce partner status (`pending` versus `active`) in page guards and partner-owned server procedures.
- [x] Add positive Vitest coverage for valid partner-owned procedures and valid admin-only procedures.

## Final verification gaps
- [x] Query and render real unclaimed destination records on the claim screen.
- [x] Bind the performance chart series and labels to metrics results with explicit metrics loading/error states.
- [x] Add a client-side active-partner status gate before rendering the private dashboard.
- [x] Add positive Vitest success-path coverage for valid partner and admin procedures.

## Final final verification gaps
- [x] Bind dashboard chart labels and filled area to real metrics rows and show an explicit metrics loading/error/empty state.
- [x] Block pending partner accounts in the dashboard render before showing active workspace content.

## AI trip planner generation flow
- [x] Define Step 3 Review as a final confirmation screen with dates, travelers, budget, interests, notes, and trust disclaimer.
- [x] Add a server-side structured itinerary-generation procedure using only verified Laguna destinations as retrieval context.
- [x] Add persisted draft/generated trip storage and a `/plan/new/result` route.
- [x] Add generation loading, progress messaging, timeout, empty-result, and error states.
- [x] Render generated results through the existing editable day-by-day itinerary experience.
- [x] Add generated-stop verification labels and save/edit/invite/poll continuation actions.
- [x] Add Vitest coverage for generation input validation, verified-destination grounding, and permissions.
- [x] Validate planner review, loading, generated result, and failure states on desktop and mobile.
- [x] Style the new planner review, generation progress, trust labels, and generated itinerary result states for responsive fidelity.
- [x] Keep the planner form before the summary card on mobile so the primary input flow is immediately reachable.

## AI planner production gap remediation
- [x] Seed real verified Laguna destination records so generation has a working success path.
- [x] Converge generated itineraries into the existing editable trip/day editor route for numeric generated trips.
- [x] Replace generated-result toast-only save/edit/invite/poll actions with real navigation flows; local stop removal remains intentionally local until stop-edit persistence is added.
- [x] Add success-path Vitest coverage for verified catalog retrieval, grounded stop filtering, and date-order rejection.
- [blocked] Capture successful generated-result desktop and mobile states; requires an authenticated live generation request and model-service availability.
- [x] Route numeric generated trips through the canonical TripPage editor and reuse shared TripStop/TripTabs primitives on `/trips/:id/itinerary`.

## Planner wizard specification alignment
- [x] Keep Step 1 limited to dates, group size, and budget.
- [x] Keep Step 2 limited to interests and optional notes.
- [x] Promote the trip summary into the main full-width Step 3 review content.
- [x] Keep Generate My Itinerary as the Step 3 API trigger with edit-back navigation.
- [x] Preserve the loading message rotation and generated-result continuity.
- [x] Validate the corrected three-screen flow on desktop and mobile.

## Planner interaction evidence follow-up
- [x] Interactively verify Step 2 Preferences and Step 3 Review/Generate transitions on desktop and mobile.
- [x] Capture desktop and mobile evidence for Step 1 → Step 2 → Step 3 and document the generated-result or authentication-blocked state.

## Generated-result editing completion
- [x] Persist generated-stop removal and drag reorder through owner-scoped planner mutations.
- [x] Add a verified-destination picker from the generated result and persist new stops.
- [x] Show a lightweight auto-saved status after generated-result edits.
- [x] Add authorization/input regression coverage for generated-stop remove, reorder, and add mutations.

## Generated-result persistence hardening
- [x] Roll back optimistic stop removal and reorder state when persistence fails.
- [x] Add invalid-payload and ownership regression coverage for stop editing mutations.

## Generated-result persisted-boundary coverage
- [blocked] Exercise remove and reorder against real persisted trip/stop ownership boundaries without mutating durable test data; the current database has zero generatedTripStops rows and test-data insertion is prohibited.
- [blocked] Exercise duplicate verified-destination add conflicts and foreign stop ids in persisted mutation tests; the current database has zero generatedTripStops rows and test-data insertion is prohibited.

## OAuth callback failure remediation
- [x] Trace the `/plan/new` login redirect and identify the callback failure stage from runtime evidence.
- [x] Handle the transient database timeout during OAuth callback user sync with bounded retry and a safe 503 response while preserving nonce/state security.
- [x] Add regression coverage for callback failure responses and `/plan/new` unauthenticated entry behavior.
- [blocked] Validate the corrected login path end-to-end; the callback now fail-closes and classifies DB outages, but a live account flow remains dependent on the external OAuth portal and database availability.

## Bundle discovery enrichment
- [x] Add a featured bundle spotlight with route highlights and a clearer primary action.
- [x] Add richer bundle metadata such as pace, ideal group, and stop count using truthful local content.
- [x] Add a curated collection rail and improve bundle filtering/empty-state feedback.
- [x] Validate bundle interactions and responsive density on desktop and mobile.

## My Wallet ticket screenshot attachments
- [x] Add S3-backed ticket attachment metadata without storing image bytes in the database.
- [x] Add owner-scoped upload and removal procedures with image type and size validation.
- [x] Add wallet UI for upload, preview, replacement, removal, and ticket-reference adjacency.
- [x] Validate ticket attachment behavior on desktop and mobile with regression tests; live authenticated S3 persistence remains environment-dependent because the sandbox session is unauthenticated and the database is timing out.

## My Wallet attachment verification hardening
- [blocked] Apply and confirm the walletTicketAttachments migration in the live database; the table exists with the expected columns and zero rows, but `__drizzle_migrations` is empty and the CLI migration connection times out.
- [x] Add explicit loading, error, and unauthorized states for wallet attachment queries and mutations.
- [blocked] Run an authenticated end-to-end upload, preview, replacement, and removal flow when OAuth and database availability permit; the sandbox session is unauthenticated and database access is timing out.

## My Wallet unauthorized recovery
- [x] Add a distinct login-required wallet attachment state with a clear login CTA for 401 responses.
- [x] Verify the unauthorized wallet state in the browser without completing OAuth.

## Wallet attachment query failure remediation
- [x] Confirm whether walletTicketAttachments exists in the live database and identify migration drift.
- [blocked] Apply the additive wallet attachment migration safely without destructive changes; the additive table was applied manually through the connected database channel, while Drizzle CLI migration recording remains unavailable due to timeout.
- [x] Ensure the planner page is not destabilized by the wallet attachment query failure.
- [blocked] Validate the authenticated planner and wallet query paths after schema synchronization; the live page loads and no missing-table error remains, but the current browser session was redirected to OAuth sign-in before authenticated verification.

## Tour Guides Phase 1 discovery
- [x] Add a public Guides tab to the primary navigation and mobile bottom navigation.
- [x] Add curated guide records tied to the existing verified destinations table, with truthful trust labels and no fabricated reviews.
- [x] Add place, specialty, search, and sort controls with a useful empty state.
- [x] Add guide detail pages with areas, specialties, typical rate range, contact methods, and an always-visible off-platform disclaimer.
- [x] Add contextual guide links from guide-relevant itinerary stops where appropriate.
- [x] Validate guide routes, filters, contact actions, trust copy, and responsive mobile behavior.

## Tour Guides Phase 1 production hardening
- [x] Bind guide service areas to the existing destination records or a shared verified destination dataset instead of standalone strings.
- [blocked] Add real per-guide contact fields with working call/message/social links, using explicit unavailable fallbacks only where no verified guide contact details have been supplied.
- [blocked] Re-run browser validation for guide detail contact actions after verified guide contact links are supplied and implemented.

## Mobile bottom navigation bug
- [x] Fix the five-tab mobile bottom navigation so icons and labels remain inside the bar without overlap or clipping.
- [x] Validate the corrected bar at 360px, 390px, and 414px widths plus desktop regression.

## Mobile bottom navigation verification evidence
- [x] Validate the corrected bottom navigation at 390px width.
- [x] Document no overlap, clipping, uneven spacing, or safe-area issue after reviewing all captured widths.

## Quick reservation wallet access
- [x] Add a prominent Wallet/References quick action to trip cards and relevant trip surfaces.
- [x] Add a compact reservation-reference preview or fast-open action that reveals booking codes without extra navigation when appropriate.
- [x] Preserve the full wallet route for ticket screenshots and complete references.
- [x] Validate fast access, reference visibility, and mobile reachability.
- [x] Add the quick Wallet/References action to the main trip detail or itinerary surface and verify it on desktop and mobile.

## Explore food and attraction expansion
- [x] Add clearly labeled placeholder Food & Restaurants records for Danielitos Home Kitchen and Malayas Cafe.
- [x] Research additional Laguna attractions from reliable sources and save source notes before implementation.
- [x] Add researched attraction records with useful descriptions, places, categories, and imagery without fabricated ratings or reviews.
- [x] Ensure Explore filters, list/grid/map views, destination detail links, and mobile behavior support the expanded catalog.
- [x] Validate the new restaurant and attraction cards with browser smoke tests and production checks.

## Hotels & Stays and customer journey validation
- [x] Research truthful Laguna hotel and stay options from reliable sources and save source notes.
- [x] Add Laguna Hotels & Stays records with destination detail views and no fabricated reviews, ratings, prices, hours, or contact details.
- [x] Validate Explore category, search, sort, filters, view toggles, cards, detail galleries, save, and booking handoff for the lodging records.
- [x] Validate the customer journey from Home through Explore, destination detail, save, Plan a Trip, My Trips, trip detail, Wallet, and mobile bottom navigation.
- [x] Fix any broken routes, dead-end actions, misleading states, or mobile layout issues discovered during the journey audit.
- [x] Add automated regression coverage for lodging content and customer-journey route contracts.

## Route plan overview and real map validation
- [x] Analyze and document the supplied route-plan overview layout and interaction hierarchy.
- [x] Add verified Philippine itinerary points with coordinates and route metadata for the overview.
- [x] Integrate the existing Google Maps frontend SDK with real markers, route lines, controls, legend, and map/satellite state.
- [x] Recreate the reference-aligned itinerary overview with day tabs, stop timeline, trip summary, action controls, and customization callout.
- [x] Validate route overview interactions, map behavior, destination points, external navigation, and mobile responsiveness.
- [x] Add automated regression coverage for route points and route-overview contracts.

## Planner NaN trip-ID error remediation
- [x] Trace the planner generation failure from UI mutation state through server status updates.
- [x] Prevent invalid or missing generated trip IDs from reaching generatedTrips update queries.
- [x] Show a clear recoverable planner error state instead of issuing an update with NaN.
- [x] Add regression tests for invalid trip IDs and valid failure-status updates.
- [x] Validate `/plan/new`, generation failure handling, TypeScript, tests, and production build.

## Planner missing created-trip ID remediation
- [x] Inspect the actual Drizzle/mysql2 insert result shape used by generatedTrips.
- [x] Recover the created trip ID reliably when insertId is absent or driver-shaped differently.
- [x] Preserve owner scoping and prevent duplicate or ambiguous trip recovery.
- [x] Add regression tests for insert result variants and invalid/ambiguous recovery.
- [x] Validate `/plan/new`, generation failure handling, TypeScript, tests, and production build.

## Route overview 1:1 reference refinement
- [x] Compare current route overview proportions, spacing, typography, controls, overlays, and content hierarchy with the supplied reference image.
- [x] Refine desktop split layout, stop timeline, summary card, top actions, map overlays, labels, legend, and bottom customization callout toward 1:1 fidelity.
- [x] Preserve real Google Maps markers, route line, map/satellite toggle, re-center action, and destination links while aligning their visual treatment.
- [x] Validate reference-fidelity interactions and responsive behavior at desktop and mobile breakpoints.
- [x] Update route overview regression checks and save a verified checkpoint.

## Route overview reference structure implementation
- [x] Document the reference hierarchy: global header, route header, AI summary banner, action group, day tabs, stop timeline, map workspace, overlays, and bottom trust/action bar.
- [x] Rebuild the route overview structure so the left timeline and right map align to the reference’s shared vertical rhythm and proportions.
- [x] Match the stop-row anatomy, active day state, map summary placement, numbered callouts, legend, controls, and customization footer.
- [x] Preserve real map behavior and route destination links while implementing the structural changes.
- [x] Validate desktop/mobile screenshots and all route overview interactions, then update regression coverage.

## Intensive route overview UI bug audit
- [x] Audit route overview stop-row anatomy, action buttons, panel boundaries, map overlays, and responsive overflow.
- [x] Reproduce overlap and wrapping risks at 1536px, 1280px, 1024px, 768px, 414px, 390px, and 360px widths.
- [x] Verify every route-view button, destination link, day control, map control, stop action, booking/guide action, and footer CTA has a safe response.
- [x] Fix confirmed overlap, clipping, wrapping, z-index, focus, and dead-end interaction issues.
- [x] Add or update automated regression coverage and complete final visual/browser validation.

## Google Maps duplicate-loader remediation
- [x] Trace all Google Maps script injection paths and route-map mount/unmount behavior.
- [x] Consolidate Google Maps initialization so the JavaScript API loads at most once per page.
- [x] Preserve real map tiles, markers, directions, controls, and satellite state after consolidation.
- [x] Add regression coverage that detects duplicate loader paths and validates the shared map contract.
- [x] Validate the route map in a fresh browser session with no duplicate-load console error, then run tests, TypeScript, and build.

## Live Trip Mode reference implementation
- [x] Audit current trip routes and map capabilities against the supplied live-trip dashboard reference.
- [x] Define truthful live-trip states for on-time, ahead, running-late, and unavailable-location cases without fabricating live telemetry.
- [x] Implement the three-column live-trip structure: trip progress rail, live map/next-stop workspace, and companion utility rail.
- [x] Add safe location permission/start-trip behavior, map user marker, next-stop card, progress state, nearby verified-stop actions, and wallet quick access.
- [x] Add responsive mobile ordering and preserve all existing trip, map, booking, guide, and wallet handoffs.
- [x] Add regression coverage and validate live-trip interactions, map loading, responsive views, TypeScript, tests, and production build.

## Dead controls and missing feature audit
- [x] Inventory every button, link, menu, preview, modal, map control, and mobile navigation action across the customer journey.
- [x] Reproduce controls that do nothing, open the wrong view, close incorrectly, or have no recoverable response at desktop and mobile widths.
- [x] Identify missing feature states, misleading placeholders, and unfinished previews that should show a clear unavailable or coming-soon response.
- [x] Fix confirmed dead controls, broken routes, missing previews, and misleading feature states without fabricating data.
- [x] Add regression coverage for audited interaction contracts and validate the primary customer journey.

## Curated route cards, assets, animations, and GitHub delivery
- [x] Inspect the wide bundle reference and document the intended card image, overlay badge, metadata, tags, and View Trip hierarchy.
- [x] Replace any incorrect text-only curated-route presentation with the reference-aligned image card view.
- [x] Verify all runtime images use valid webdev asset URLs and all required animation styles remain in source-controlled project files.
- [x] Validate bundle cards at desktop/mobile widths, including image loading, animations, navigation, and no overlap or overflow.
- [x] Run tests, TypeScript, and production build before committing.
- [x] Commit and push the verified project and assets/code to the configured GitHub repository.

## Final cross-viewport evaluation
- [x] Audit every primary route, modal, drawer, preview, map surface, and navigation window for missing or broken animation states.
- [x] Capture and compare key surfaces at 1536, 1382, 1280, 1024, 768, 414, 390, and 360px widths.
- [x] Run interaction and route smoke tests for all customer, planner, wallet, trip, live-trip, guide, and partner surfaces.
- [x] Verify reduced-motion behavior, focus/keyboard access, overflow, fixed navigation containment, image loading, and console cleanliness.
- [x] Run the full test suite, TypeScript, production build, and record environment-blocked checks separately.
- [x] Fix confirmed regressions and save a final verified checkpoint.

## Minimalist scrolling landing-page animation
- [x] Audit the landing-page sections, existing motion tokens, and responsive layout boundaries.
- [x] Add restrained scroll reveal choreography for hero, destinations, bundles, and supporting sections.
- [x] Add subtle scroll-linked image/parallax motion without affecting layout or readability.
- [x] Respect prefers-reduced-motion and avoid scroll jank, excessive movement, or inaccessible hidden content.
- [x] Validate desktop, tablet, and mobile scroll behavior, image loading, navigation, and build/tests.

## Bundles reference text-layout correction
- [x] Audit bundle card title, metadata, description, tags, audience note, and action alignment against the supplied reference.
- [x] Correct the Bundles card typography and spacing so labels and titles do not collide or clip.
- [x] Validate the corrected grid at desktop and mobile widths, including filter pills and card actions.

## Mobile landing-page composition correction
- [x] Audit the compact hero, featured-destination rail, and fixed bottom navigation at the reported mobile width.
- [x] Correct mobile hero height and destination-card typography/overflow to match the supplied reference.
- [x] Preserve bottom-nav clearance and validate mobile plus desktop regression behavior.

## Mobile hero readability correction
- [x] Audit mobile hero copy width, line breaks, contrast, header layering, and action spacing from the supplied reference.
- [x] Make the supporting itinerary sentence readable at narrow mobile widths without affecting desktop composition.
- [x] Validate hero copy, buttons, header, bottom navigation, and build/tests at mobile and desktop sizes.

## Mobile tab scroll restoration
- [x] Audit the router and BottomNav transitions for scroll restoration behavior.
- [x] Reset the viewport to the top when switching primary mobile tabs without disrupting browser history.
- [x] Validate Home, Explore, Guides, Plan, Trips, and Saved tab switching plus direct navigation and tests.

## Researched Laguna destination enrichment
- [x] Research Enchanted Kingdom and Los Baños falls/resort candidates using venue and travel sources.
- [x] Add Enchanted Kingdom, Dampalit Falls, Al Fresco Springs, and Laresio Lakeside Resort & Spa with truthful verification and rating states.
- [x] Upload persistent venue imagery and promote Enchanted Kingdom plus Laresio in Home Featured Destinations.
- [x] Validate Home, Explore, and destination detail routes at mobile and desktop widths with regression tests.

## Philippines-wide discovery expansion
- [x] Audit current Explore category controls and Laguna-specific labels across Home, Explore, map copy, and navigation.
- [x] Add an explicit Attractions filter/category that works with the existing destination catalog.
- [x] Replace Laguna-only Explore wording with Philippines-focused copy while keeping Laguna records and routes intact.
- [x] Validate filter results, empty states, mobile controls, and regression tests.

## Category strip horizontal scrolling
- [x] Audit the Explore category-strip width and overflow behavior at narrow mobile widths.
- [x] Make all category pills horizontally scrollable without wrapping or viewport clipping.
- [x] Validate touch/keyboard access, active states, desktop regression, and tests.

## Explore view-toggle and UI structure audit
- [x] Audit Map, List, and Grid controls for state changes, content visibility, and mobile containment.
- [x] Make each Explore view toggle visibly render its intended result layout and accessible active state.
- [x] Audit Explore desktop/mobile spacing, clipping, category rail, filters, map legend, result cards, and bottom navigation.
- [x] Add regression coverage and validate all three views at representative desktop and mobile widths.

## Responsive footer section
- [x] Audit shared page shells and choose footer placement that does not conflict with the fixed mobile bottom bar.
- [x] Add a minimalist responsive footer with branded context and wired navigation links.
- [x] Validate footer spacing, link destinations, mobile bottom-bar clearance, desktop layout, and regression tests.

## Truthful review availability state
- [x] Audit current rating/review labels in Explore cards, destination detail, bundle cards, and bundle itinerary views.
- [x] Replace unavailable review presentation with a consistent “Reviews coming soon” state without adding fabricated feedback.
- [x] Validate responsive presentation and add regression coverage for bundle and Explore review states.

## Explore LB label update
- [x] Audit Explore-only headings and CTA labels for the current Philippines wording.
- [x] Replace the Explore tab’s visible “Explore the Philippines” label with “Explore LB” without changing global Home messaging.
- [x] Validate Explore navigation, mobile label fit, and regression tests.
- [x] Replace the Home hero CTA text with “Explore LB” while preserving its existing `/explore` destination.

## Featured Events & Destinations heading correction
- [x] Verify whether the visual editor heading change was applied or missed because the target selector was stale.
- [x] Apply “Featured Events & Destinations” to the actual Featured section heading if still unchanged.
- [x] Validate the heading on desktop and mobile, run regression checks, and save a checkpoint.

## Local clone image packaging
- [x] Inventory all image references used by the current build and identify which assets need local copies.
- [x] Add a Git-tracked local asset fetcher and manifest plus a local-compatible image resolution strategy without breaking Manus-hosted paths.
- [x] Validate fresh-clone asset loading, tests, TypeScript, production build, and repository synchronization.

## Los Baños stays and Local Spots Highlights
- [x] Research Airbnb Los Baños handoff behavior, a verified local food-market candidate, and a local night-market candidate.
- [x] Add a Los Baños stays discovery section with an Airbnb area-search handoff and truthful availability/rating treatment.
- [x] Add Local Spots Highlights for food-market and night-market discovery with clear details-pending states where needed.
- [x] Validate links, content labels, mobile/desktop layout, and regression tests.

## Comprehensive Los Baños attractions catalog
- [x] Research publicly verifiable Los Baños attractions across heritage, nature, hot springs, science, education, food/community, recreation, and family categories.
- [x] Normalize the expanded attraction records with category, location, description, verification state, and source notes.
- [x] Integrate the expanded catalog into Explore filters and destination detail routes without fabricated ratings, reviews, or operating claims.
- [x] Validate catalog coverage, filters, routes, responsive cards, tests, and production build.

## Home alignment and Accommodations discovery
- [x] Audit Local Spots Highlights and map-preview alignment against the supplied desktop reference and mobile stacking behavior.
- [x] Correct heading baselines, card heights, spacing, and map-preview proportions without disrupting the footer or bottom navigation.
- [x] Add an Accommodations tab/filter with Los Baños hotels and resorts plus a truthful Airbnb area-search handoff.
- [x] Validate tabs, external links, card alignment, responsive layout, and regression tests.

## Partner reservation-intake dashboard expansion
- [x] Reconcile the attached dashboard plan with the current React/tRPC/Drizzle/MySQL architecture and document the MVP boundaries.
- [x] Add partner listing subtype and reservation opt-in settings for hotel/resort, Airbnb-style host, and restaurant partners.
- [x] Add reservations, inventory units, availability blocks, and partner notification persistence models with additive migrations.
- [x] Add partner-scoped reservation queries and mutations with owner/staff/admin authorization checks.
- [x] Add reservation request, confirm, cancel, complete, and no-show status workflows with conflict-safe validation.
- [x] Add availability and calendar controls for accommodation inventory and opt-in restaurant time slots.
- [x] Add category-aware inventory management for rooms, vacation units, table categories, and restaurant menu highlights.
- [x] Add partner dashboard tabs for Overview, Reservations, Availability & Calendar, Inventory, Listing Management, Reviews & Feedback, Analytics, Featured Placement, Notifications, and Account & Settings.
- [x] Add reservation-volume, conversion, and cancellation analytics without fabricating live metrics.
- [x] Add in-dashboard partner notifications for new reservation requests, cancellations, review flags, and admin messages.
- [x] Preserve the no-payment/no-card-storage/no-external-calendar-sync boundary in UI copy and backend behavior.
- [x] Add regression tests for reservation ownership, role boundaries, status transitions, availability conflicts, opt-in behavior, and notification access.
- [x] Validate partner dashboard tabs and reservation workflows at desktop and mobile widths, then save a checkpoint.
- [x] Add a view-only Reviews & Feedback partner tab with truthful empty states and admin flag handoff.
- [x] Add owner-only staff management controls for inviting and removing partner staff members.
- [x] Add category-aware availability copy and controls for accommodation date ranges and restaurant same-day requests.
- [x] Document multi-property support as a deliberate follow-up boundary because the current account model resolves one active listing per partner workspace.
- [x] Document external email/SMS/push notifications as provider-dependent follow-up work; keep the in-dashboard source of truth implemented now.
- [x] Fix PartnerPortal runtime error: `MessageSquare is not defined` on `/partners/dashboard`.

## Happening feed MVP
- [x] Reconcile the Happening brief with the current React/tRPC/Drizzle/MySQL architecture and document the Phase 1 boundaries.
- [x] Add additive feed post and user notification persistence models for admin-curated time-sensitive events.
- [x] Add admin-only feed post creation, editing, publishing, rejection, and archive-safe procedures.
- [x] Add urgency-based public feed queries with computed Happening Now, Starting Soon, Upcoming, and Past states.
- [x] Add feed type, town/place, and near-me-compatible filters without exposing stale archived items in the live feed.
- [x] Add the public Happening route with post detail views, linked destination/partner context, source labels, outbound handoffs, and distinct type badges.
- [x] Add a homepage Happening in Laguna strip between the hero and featured destinations.
- [x] Wire the existing bell icon to in-app feed notifications with unread state, read actions, and deep links.
- [x] Add an admin Happening management workspace with truthful empty/loading/error states.
- [x] Add regression tests for timestamp status computation, urgency ordering, admin authorization, notification ownership, and stale-post exclusion.
- [x] Validate Happening desktop/mobile layouts and document partner submissions, push delivery, payment, and external calendar sync as follow-up boundaries.

## Stock image GitHub delivery
- [x] Confirm the current repository intentionally excludes binary stock images and document the managed-storage/deployment constraint.
- [x] Download the eight referenced stock assets into the external static-assets workspace and verify their sizes and content types.
- [x] Publish a versioned stock-image archive as a public GitHub Release asset after confirming the repository visibility, without adding binaries to the deployment source tree.
- [x] Update the README with exact GitHub Release download and local setup instructions while preserving the existing asset fetcher.
- [x] Validate the archive contents, GitHub release availability, and local asset recovery path, then save a checkpoint.
