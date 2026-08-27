# Happening Feed MVP Architecture Reconciliation

## Current project baseline

The attached brief describes a Next.js + Supabase direction, while the active Kabiyahe project is React 19 + Vite + Express + tRPC v11 + Drizzle ORM + MySQL/TiDB with Manus OAuth and S3-backed storage. The Happening feature will extend the existing route, navigation, partner, destination, and notification conventions rather than introduce a second framework or database layer.

## Phase 1 scope

The MVP is an admin-curated, time-sensitive feed for local events, pop-ups, promotions, cultural events, and closure alerts. It includes a public Happening route, a Home-page strip, computed timestamp states, urgency ordering, type/place filters, linked destination and partner context, source labels, outbound links, and in-app bell notifications. Admins can create and manage posts through an internal workspace.

## Computed status contract

A live post with a future start more than 24 hours away is Upcoming. A post whose start has passed and whose end has not passed is Happening Now. A post beginning within the next 24 hours is Starting Soon. A post whose end time has passed is Past in the archive and excluded from the default live feed. Open-ended alerts remain live until explicitly resolved or archived.

## Trust and data boundaries

Phase 1 permits only authenticated administrators to create or publish feed posts. Partner self-serve announcements, rate limiting, boosted placement, Tourism Council direct feeds, Expo push notifications, SMS, and external email are follow-up work. The feed may link out to official venue or ticket pages, but Kabiyahe will not claim live availability, collect payment, store card details, or create fabricated reviews or event facts.

## Reuse decisions

Existing destinations and partners are referenced by foreign-key-like identifiers when a post is linked to an existing record. The existing user-scoped notification pattern is extended for feed-post notifications. The existing header bell becomes a real unread notification entry point, and route-aware scroll restoration remains active for the new feed and detail routes.
