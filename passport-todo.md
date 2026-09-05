# Passport page rebuild — plan for next session

Mockup reference: `D:\El-Biyahe!\website\passport.png` (an "ELBi G!" mockup) plus the
component/widget breakdown doc pasted into chat on 2026-09-05. This mirrors the two prior
rebuilds this session (Ride Guide → "Transpo" style, Parking → discovery tool): same shell
pattern (hero + two-column body + full-width footer CTA), same rule — **reuse real data,
adapt anything the app can't honestly back, never fabricate**. This file is the handoff plan;
nothing in this scope has been implemented yet.

Current implementation: `Passport()` in `client/src/pages/ElbiyaheFeatures.tsx:812-971` — a
single-column page (scan button, stamp-category counts, a nearby-stamps list, a season-reward
track). No hero banner, no ID-card widget, no missions, no leaderboard, no XP-cost redeem flow.

---

## 0. What's already real (reuse, don't rebuild)

Confirmed via `usePassport()`/`useScanPassport()` (`client/src/lib/supabase/queries.ts:152-207`)
and the schema (`supabase/migrations/20260904090001_elbi_core.sql`):

- **XP + level**: `profiles.xp`, `profiles.explorer_level` — real, already tracked, already
  incremented somewhere (check `scan_passport` RPC in `20260904090002_elbi_functions.sql` for
  exact XP-per-scan logic before building the XP bar math).
- **Stamps**: `passport_locations` (real table, `passport_locations_public` view drops the
  scannable `qr_code`) + `passport_scans` (per-user collected rows). **Only 4 real rows exist
  today** (`makiling-botanic-gardens`, `los-banos-museum` i.e. Old LB Train Station,
  `buko-pie-house`, `irri-riceworld`) — the mockup's 10+ stamp names (Baker Hall, Freedom Park,
  Pagsanjan Falls, UPLB Museum, Japanese Garden, Centennial Tree, LB Plaza, Mt. Makiling…) are
  **not** in our data and must not be copied in verbatim.
- **Rewards**: `passport_rewards` (gated by `required_stamps`, not an XP cost) +
  `reward_redemptions` (already has a redemption-code mechanic, `partner_id`) — a real
  redeem flow exists, just structured differently than the mockup's "XP cost" model.
- **QR scanning**: `scan_passport` RPC + the existing `elbiyahe-scan-btn` modal flow — reuse
  as-is, this is the real check-in mechanic the mockup's QR code implies.

## 1. Gaps vs. the mockup — decide before building

- [ ] **Grow `passport_locations` beyond 4 rows.** The app already has ~33 `destinations` plus
  a 17-stop Heritage Walk (see `los-banos-heritage-walk` event) — cross-reference those for
  real candidate stamp spots (Baker Hall and UPLB Museum both plausibly already exist as
  destinations or heritage-walk stops) before inventing anything. **M**
- [ ] **Leaderboard needs `xp` added to the `profiles_public` view** — it currently exposes
  only `id, display_name, explorer_level` (`supabase/migrations/20260904090006_elbi_public_views.sql:12-13`).
  Decide if surfacing XP publicly is acceptable (it's comparable to a public game score) —
  if yes, one-line migration + a `useLeaderboard()` query ordered by `xp desc limit N`. **S**
- [ ] **Leaderboard will likely be sparse/empty right now** — this looks like a
  pre-launch/single-admin-account state. Build the real query, but expect (and design for) an
  honest "not enough explorers yet" empty state rather than the mockup's 5 fictional ranked
  names (Andrea Reyes, Miguel Dela Cruz, etc.). **Do not seed fake leaderboard users.**
- [ ] **Missions don't exist at all** — no `passport_missions` / progress-tracking table. The
  mockup's "Nature Seeker: visit 5 nature spots," "Foodie Adventure," "Community Explorer" are
  a real, buildable mechanic (derivable from existing category counts / RSVPs / delicacy
  visits) but need: a `passport_missions` table (title, description, category, target_count,
  xp_reward) + a progress query joining against `passport_scans`/`events_rsvps`/etc. **L**
- [ ] **Redeem-by-XP-cost UI doesn't match the schema** — `passport_rewards.required_stamps`
  is a *gate*, not a spendable cost. Decide: (a) keep the stamp-gate model and just restyle the
  cards ("Unlock at N stamps" instead of "Redeem for N XP"), or (b) add an `xp_cost` column and
  a real spend/redemption transaction (debits `profiles.xp`, inserts `reward_redemptions`).
  **(a) is much less work and doesn't risk double-spending bugs — recommended default.** **S/M**
- [ ] **Stamp art** — every stamp is currently rendered with a generic dot/icon, no
  illustration. The mockup's circular landmark-illustration badges (collected/locked/mystery
  states) need real art per location — see the image list below. **L**
- [ ] **"Mystery/Secret Spot" stamp** — the doc itself flags this as an open question (reveal
  trigger: geolocation? code redemption? random?). Pick the simplest real mechanic: e.g. a
  `passport_locations` row with `active=true` but deliberately omitted from the public list
  until scanned once (discovery-by-QR, not spoiled in advance) — matches the existing
  `qr_code`-hidden-until-scan pattern already in the schema. No new mechanic needed if scoped
  this way.
- [ ] **"Share Passport"** button — no share/OG-image endpoint exists yet. Scope as a simple
  Web Share API / clipboard-link action (no backend), or drop it — don't fabricate a share
  card image pipeline for this pass.

## 2. Section-by-section build plan (once the above is decided)

Reuse exactly what Ride Guide/Parking already established:
- Two-column shell → `.detail-layout` (already used for both prior rebuilds).
- Hero → adapt `.elbiyahe-transpo-hero` (already added to `elbiyahe.css` this session).
- Sidebar cards → `.elbiyahe-featured-card` / `.elbiyahe-widget-rail` (already established).
- Footer value-props band → `.elbiyahe-value-props` + `.elbiyahe-community-cta` (already
  added for Ride Guide's CommunityCTA — the doc confirms this is meant to be the same
  generic component, just relabeled "Why ELBi G! Passport?" with 4 items instead of 3).
- Progress bars → reuse `.progress`/`.progress span` (already used elsewhere, e.g. trip pages).
- Modals (Share, Redeem confirm, Report) → reuse the `.modal-backdrop`/`.modal`/`.modal-field`
  pattern (`RideFeedbackModal`/`ParkingFeedbackModal`/`SuggestionModal` are all this same shape).

| Component | Notes |
|---|---|
| `PassportHero` | Real banner photo needed (see image list) + a wax-seal graphic (decorative, can be a static SVG, not per-user). |
| `PassportCardWidget` | Real: name (`profiles.display_name`), avatar (does a profile-photo field exist? check `profiles` columns — if not, use an initials avatar like the existing `.avatar` pattern in `App.tsx`), tier from `explorer_level`, XP bar from `profiles.xp`/level thresholds, Passport ID (can be `id.slice(0,8)` formatted, or add a real `passport_code` column), QR code (render `user.id` or a dedicated code — reuse whatever `scan_passport` already expects on the *scanning* side, don't invent a second QR payload format). |
| `PassportStats` | Real: stamps collected, total XP, places visited (=stamps), events joined (query `event_rsvps`/similar — confirm table name first). |
| `ShareJourneyCallout` | Simple, see share-button note above. |
| `MyStampsGrid` | Real locations + real `passport_scans`; locked state for unscanned real locations; mystery state only if the discovery mechanic above is built. |
| `PassportMissionsList` | Only build if missions table (1.) is built this session — otherwise ship without it or as "Coming soon" (same honest pattern as Ride Guide's Terminal Guide). |
| `EncouragementBanner` | Real: personalize with `profiles.display_name`, generic non-fabricated copy. |
| `RedeemRewardsPanel` | Real `passport_rewards`, restyled per the 1.4 decision. |
| `LeaderboardPanel` | Real query per 1.2/1.3 — ship the honest-empty-state version. |
| `PromoBanner` | Exact reuse of the existing `.elbiyahe-newsletter-card` Passport promo already used on Delicacies/Ride Guide/Parking — for this page it'd point somewhere else (maybe `/explore`) since you're already on Passport. |
| `WhyPassportCTA` | Reuse `.elbiyahe-community-cta` + `.elbiyahe-value-props` exactly as built for Ride Guide, just 4 items instead of 3 and different copy. |

---

## 3. Missing images to source/generate (naming convention)

This repo's real photos live in the **`vinsu-hub/el-biyahe-stock-images`** GitHub Releases repo
(`v2.0.0` tag) and are fetched at build time by `scripts/fetch-local-assets.mjs` into
`client/public/assets/`. Naming convention for that set: **`elbiyahe-<kebab-case-subject>.jpg`**
(e.g. `elbiyahe-pagsanjan-falls.jpg`, `elbiyahe-uplb-campus.jpg`). Illustrated/decorative art
(non-photo) instead lives in `client/public/scenes/` as **`elbiyahe-<kebab-case-name>.svg`**
(e.g. `elbiyahe-bus.svg`, `elbiyahe-passport.svg` — already exists and is the current Passport
header image).

To replace every placeholder on the rebuilt Passport page with real assets, source/create:

**Photos** (add to the stock-images release, follow the `.jpg` convention above):
- [ ] `elbiyahe-passport-hero-banner.jpg` — the hero's landscape banner (Mt. Makiling + the
      clocktower/lake, per the mockup). Could reuse an existing stock photo already fetched
      (`elbiyahe-mount-makiling.jpg` or `elbiyahe-hero-losbanos.jpg` already exist per
      `scripts/fetch-local-assets.mjs`) instead of sourcing a new one — check those first.

**Stamp badge illustrations** (new asset type — recommend SVG in `client/public/scenes/stamps/`
following **`elbiyahe-stamp-<location-slug>.svg`**, matching each real `passport_locations.slug`
so the client can do `` `/scenes/stamps/elbiyahe-stamp-${loc.slug}.svg` `` with zero per-row
data-entry):
- [ ] `elbiyahe-stamp-makiling-botanic-gardens.svg`
- [ ] `elbiyahe-stamp-los-banos-museum.svg` (Old LB Train Station)
- [ ] `elbiyahe-stamp-buko-pie-house.svg`
- [ ] `elbiyahe-stamp-irri-riceworld.svg`
- [ ] one per any **new** real location added per §1's first checkbox (name them the same way
      once those slugs are decided — don't pre-name stamps for spots that aren't confirmed real
      yet)
- [ ] a single reusable **locked-state** treatment (e.g. a CSS `grayscale()`/`opacity` filter
      applied to the same collected-state SVG, per the mockup's "Hidden Falls" example) —
      doesn't need a second asset per location if done this way.
- [ ] a single reusable **mystery-state** graphic: `elbiyahe-stamp-mystery.svg` (dashed circle
      + "?", one asset reused for every undiscovered mystery slot, not one per location).

**Decorative/brand** (SVG, `client/public/scenes/`):
- [ ] `elbiyahe-passport-seal.svg` — the circular wax-seal "ELBi G! Passport · Los Baños" mark
      overlaid on the hero banner.
- [ ] `elbiyahe-skyline-motif.svg` — the low-opacity clocktower+palms illustration reused in
      both the `EncouragementBanner` and the `WhyPassportCTA` footer band (per the mockup,
      it's the same decorative motif in both places — one asset, not two).

Do **not** source or invent: individual user avatar photos (use the existing initials-avatar
pattern already in `App.tsx`'s `.avatar` class for any user without a real profile photo url),
or any leaderboard-user avatars beyond whatever real users exist.

---

## 4. Suggested order of work next session

1. Decide the four items in §1 that are pure product decisions (leaderboard XP exposure,
   redeem-by-stamp vs XP-cost, mystery-stamp mechanic, share-button scope) — these gate
   everything else.
2. Grow `passport_locations` with real sourced spots (reuse existing `destinations`/heritage-walk
   data where possible) — do this before commissioning stamp art, so art isn't wasted on a slug
   that gets renamed.
3. Source/commission the stamp illustrations + hero banner (§3) in parallel with step 4.
4. Build the page section-by-section per §2, reusing the Ride Guide/Parking CSS classes already
   in `elbiyahe.css` — this should mean very little *new* CSS, mostly new JSX + queries.
5. Migrations needed (additive, same style as the last two): `profiles_public` view + `xp`
   column (if leaderboard approved), `passport_missions` + a progress query (if missions
   approved), any new `passport_locations` rows.
