# Partner Reservation-Intake Architecture Reconciliation

## Current implementation baseline

The attached brief describes a Next.js + Drizzle + Supabase application, but the active Kabiyahe project is a React 19 + Vite + Express + tRPC v11 + Drizzle ORM + MySQL/TiDB application. Authentication is provided by Manus OAuth, partner access is enforced through tRPC middleware, and images/files use the project S3 storage helpers. The implementation will preserve the active project architecture rather than introducing a second framework or database layer.

## Existing reusable structures

The current `partners` table already stores `partnerType` values for spot, restaurant, hotel, and guide, plus listing details, booking URL, owner user, status, and visibility tier. The existing partner router provides partner/admin procedures, owner-scoped listing access, admin review actions, metrics, photos, and claim flows. The current `PartnerLayout` already provides the category-aware sidebar, authenticated access states, and strict admin gate. The current partner dashboard is a visibility and listing workspace, so the new reservation-intake capabilities will extend that shell instead of creating separate dashboards.

## MVP data-contract decisions

The first implementation will add additive MySQL tables for reservation records, inventory units, availability blocks, and in-dashboard partner notifications. It will also add partner-level reservation settings and a listing subtype field so hotel/resort, Airbnb-style host, and restaurant workflows can diverge without duplicating the dashboard. Reservations will reference the partner and optionally a destination or inventory unit; restaurants can use same-day time slots, while accommodations can use date ranges. Status transitions will be requested, confirmed, completed, cancelled, and no-show.

The first release will use partner approval of reservation requests rather than automatic confirmation. Availability checks will be performed server-side before creating or confirming a request, with additive conflict-safe validation appropriate to the MySQL/TiDB project. All reservation and guest data will be scoped to the owning partner or an authorized admin. Existing user roles are user, partner, and admin; staff access will be represented as a future-compatible field/model only if it can be added without weakening current owner/admin boundaries.

## Explicit boundaries

Kabiyahe will store reservation details but will not collect payments, store card or e-wallet credentials, process refunds, or synchronize external channel-manager calendars in this phase. Airbnb remains an external handoff unless a separate verified integration is later added. Notifications will begin as an in-dashboard notification inbox and bell state; external email/SMS delivery requires a separately selected provider and credentials and will not be silently fabricated.

## Build order

The implementation sequence is: additive schema and migration, server query/mutation contracts, Reservations tab, availability/calendar, inventory, notifications, analytics extensions, then responsive and authorization validation. Every feature will include loading, empty, error, unauthorized, and truthful-data states.
