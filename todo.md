# Kabiyahe Deep Audit Checklist

## Reference fidelity
- [ ] Compare Home against the supplied landing-page reference.
- [ ] Compare Explore against the supplied map/list reference.
- [ ] Compare Destination Detail against the supplied Pagsanjan Falls reference.
- [ ] Compare Bundle Detail against the supplied bundle reference.
- [ ] Compare Plan a Trip against the supplied form reference.
- [ ] Compare My Trips against the supplied dashboard reference.
- [ ] Compare Trip Itinerary against the newly supplied itinerary reference.
- [ ] Check desktop and mobile hierarchy, spacing, typography, imagery, and responsive transformations.

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
- [ ] Record every visible control with no response, incorrect route, or placeholder response.

## Evidence and output
- [x] Capture representative desktop screenshots.
- [x] Capture representative mobile screenshots.
- [x] Check browser and dev-server logs.
- [ ] Produce a severity-ranked gap table.
- [ ] Produce an implementation plan for each missing or broken response.

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
- [ ] Save and deliver the Partner Portal implementation.

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
