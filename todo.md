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
- [ ] Capture representative desktop screenshots.
- [ ] Capture representative mobile screenshots.
- [ ] Check browser and dev-server logs.
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
