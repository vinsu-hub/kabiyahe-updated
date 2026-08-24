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
