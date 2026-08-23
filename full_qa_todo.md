# Kabiyahe Full QA Execution Backlog

## Frontend-testable checks
- [x] Validate signup/login form validation and success states.
- [x] Validate public destination and bundle routes, fields, tags, filters, search, empty states, and map/list/grid transitions.
- [x] Validate destination detail and outbound booking affordances.
- [x] Validate planner input controls, invalid dates, group size, budget, interests, review, and generation states.
- [x] Validate bundle browsing, filtering, detail views, and clone response.
- [x] Validate itinerary editing, day/stop actions, dialogs, wallet links, and route consistency.
- [x] Validate members and poll UI states and response paths.
- [x] Validate wallet add/filter/edit/copy/share states and privacy copy.
- [x] Validate all public and trip-specific routes at desktop and mobile sizes.
- [x] Validate keyboard focus, visible labels, reduced motion, console errors, build, and route status.
- [x] Validate outbound link labels and current target behavior for every implemented booking action.

## Backend-dependent checks to report as blocked until full-stack enablement
- [blocked] Email verification, duplicate-account enforcement, password reset, social login, secure sessions, logout invalidation, and protected-route enforcement.
- [blocked] Per-user data isolation, account deletion, ownership transfer, and direct API permission checks.
- [blocked] Admin destination/bundle CRUD and moderation workflow.
- [blocked] Real coordinates, clustering, opt-in live heatmap, location randomization, aggregation, retention, and cold-spot accuracy.
- [blocked] Real AI generation quality, factual venue validation, budget/travel-time constraints, caching, rate limits, timeout handling, and refinement context.
- [blocked] Persistent cloning, clone counts, independent copies, and bundle lifecycle integrity.
- [blocked] Persistent drag-and-drop ordering, multiple-trip isolation, and wallet orphan handling.
- [blocked] Real collaboration permissions, invite revocation, concurrent editing, and live member updates.
- [blocked] Persistent poll deadlines, tiebreakers, duplicate-vote prevention, and winner application.
- [blocked] Wallet uploads, permanent stop linkage, access control, offline sync, and payment-data exclusion.
- [blocked] Guide/food listing moderation and outbound-link monitoring.
- [blocked] Analytics integrity across itinerary sources.

## Deliverables
- [x] Record pass, fail, partial, and blocked status for each section.
- [x] Record evidence and exact reproduction paths for failures.
- [x] Prioritize P0 privacy/security, P1 trust/data integrity, P2 functional UX, and P3 polish.
- [x] Produce full QA report with remediation plan and upgrade requirements where applicable.
