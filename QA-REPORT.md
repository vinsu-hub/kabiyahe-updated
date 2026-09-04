# El-Biyahe! — Phase 11 + 12 QA Report

> **Resolution (2026-09-04):** user approved all findings. Fixed in 3 commits
> (`95f0aa1` responsive, `805d339` correctness/a11y/polish, `e2f3ea5` scenes + seed data)
> plus asset-pipeline + Vercel commits. **Deferred:** #9 full save-persistence
> (SaveButton stays local-only; `/saved` now shows an honest empty state), #22 dead-CSS
> cleanup (out-of-scope risk), #24 regional-destinations framing (product call).
> Re-verified: `pnpm check` + `build` clean, Explore no overflow 768–1200, mobile Filters
> reveals the rail, modals close on Escape, write flows 8/8, admin CRUD + RLS pass,
> zero console errors. Merged to `main`, deployed → **https://el-biyahe.vercel.app**


Branch `rebrand/el-biyahe` · 2026-09-04 · automated sweep + manual screenshot review

**Method**
- `scripts/qa-responsive.mjs` — 16 public + 8 admin routes × up to 7 breakpoints (375/414/768/900/1024/1280/1440), 150 screenshots, console + network capture, horizontal-overflow detection. → `screenshots/qa/responsive-report.json`
- `scripts/qa-interactions.mjs` — every visible control clicked per route (re-navigating each time so handles never go stale) + focused overlay pass at 390/1280. → `screenshots/qa/interactions-report.json`
- `scripts/qa-writeflows.mjs` — all 5 write flows driven in a real logged-in browser, resulting Supabase rows verified with the service key, RLS checked. 
- Manual review of the full screenshot set in `screenshots/qa/`.

**Verdict:** the app is in good shape. **All 8 write-flow checks pass**, **no console errors** anywhere except one React warning on the guest-redirect path, **no broken buttons**, **no stuck overlays** except the modal not closing on Escape, RLS holds. Findings are one real responsive bug (Explore, known), one React correctness warning, one modal-a11y gap, and a cluster of content / polish / feature-stub items.

---

## Priority fix list

| # | Sev | Area | Finding | Fix location |
|---|-----|------|---------|--------------|
| 1 | **High** | Responsive | Explore page overflows the viewport from ~715px to ~1150px — search row + `.searchbox` (fixed `width:380px`) + view-toggle run off-screen, map panel clipped, heading crams into 3 lines | `index.css` — raise the `@media(max-width:700px)` Explore block to ~1150px (or add an intermediate rule); make `.searchbox` `width:100%` |
| 2 | **High** | Responsive | On Explore **mobile**, the "Filters" button is dead — there is no `.filter-rail.open` CSS, so the Categories / **Tags** / **Price Range** filters are completely unreachable below 700px (only the 6 quick-filter pills work) | `index.css` mobile block + `App.tsx` `Explore` (rail already toggles `.open`) |
| 3 | **Med** | Correctness | `/account` and `/saved` while logged out call `navigate()` **during render** → React "Cannot update a component while rendering" console error; also `/saved` redirects to `?next=/account` (wrong return path) | `App.tsx:299` `Account` — move redirect into `useEffect`, use the real path |
| 4 | **Med** | A11y / UX | The `Modal` component (passport scan, and any future use) does **not close on Escape** and has no focus trap — only backdrop-click and the X button close it | `App.tsx:295` `Modal` — add `keydown` Escape handler + focus management |
| 5 | **Med** | Branding / function | Passport scan modal shows **corrupted demo codes**: `El-Biyahe!YAHE-MAKILING` (placeholder + hint text). A rebrand sweep replaced `ELBI` inside `ELBIYAHE-MAKILING`. Real QR codes are `ELBIYAHE-*`, so anyone copying the hint gets "invalid code" | `ElbiyaheFeatures.tsx:625,630` → `ELBIYAHE-MAKILING` etc. |
| 6 | **Med** | Content | Scene-SVG hero illustrations carry baked-in `<text>` captions (`x=60,y=740/775`) that clip on the left/bottom on detail heroes ≤~430px, and name a place that can mismatch the page (a Makiling tour whose hero is `elbiyahe-campus.svg` shows "UPLB Campus") | delete both `<text>` lines from all 10 `client/public/scenes/*.svg` |
| 7 | **Med** | Content / logic | Passport progress is hardcoded `/ 30` but only 4 passport locations exist — "1 / 30" reads as broken, bar barely moves | `ElbiyaheFeatures.tsx:496` `const total = 30` → `data?.locations.length` (or a real target) |
| 8 | **Med** | Content | All 3 `accommodations` rows have `booking_referral_url = null` — the Reserve toast says "Opening the venue's own booking channel" but nothing opens (the `referral_events` row *is* written) | seed real URLs, or soften the toast when the URL is null |
| 9 | **Med** | Feature stub | Save / bookmark is local `useState` only — nothing persists, and **`/saved` renders the full Profile page** (the `savedOnly` prop only swaps the `<h1>`). "Saved for later" has no data and no view | `App.tsx` `SaveButton` (130), `Account` (296) — out of scope to build fully; at minimum make `/saved` show an honest empty state |
| 10 | **Low** | Polish | Event / tour detail hero: the decorative SVG sun-blob pokes above the hero frame and sits behind the save/share buttons — visually messy at every width | drops out of #6 if the scenes are simplified, else reposition the blob in the SVGs |
| 11 | **Low** | Polish | Account "Sign out" button uses class `button outline` — `.button` is **not defined** in any CSS, so it renders as a bare unstyled box | `App.tsx:314` → `btn outline` |
| 12 | **Low** | Content | Seed events carry static `today` / `live` statuses on Feb 2026 dates — 7 months stale; Events page shows "LIVE NOW" on past events (`status` is intentionally not recomputed — this is the trade-off, but the seed data should be refreshed) | update `events.status` / dates in seed + live |
| 13 | **Low** | Copy | "Los Baños Hot Springs" description says "lush mountain landscape" but the Phase 10 photo is a public mineral-water pool | reword the row `description`, or swap the image |
| 14 | **Low** | Copy | Hero headline "What's happening in LB? Come Curious." is low-contrast over the image at ~740–1000px (the wider desktop `.hero-overlay` gradient with a narrower viewport) | tune `.hero-overlay` for the 700–1050 range |
| 15 | **Low** | Polish | `.eyebrow` (11px, `letter-spacing:.14em`, uppercase) renders "El-Biyahe!" so the "!" reads as "I" → "EL-BIYAHEI BAÑADA" on the season banner / passport season track | tighten tracking on that class, or don't uppercase the brand name |
| 16 | **Low** | Polish | Admin nav at 820px collapses to a top bar but leaves ~280px of empty green space before content | `admin.css:83` `@media(max-width:820px)` |
| 17 | **Low** | Polish | Delicacy / accommodation cards show a lone empty `MapPin` icon on its own line above the wrapped address (the `.muted` flex doesn't keep it inline) | `ElbiyaheFeatures.tsx` `DelicacyCard` / `AccommodationCard` |
| 18 | **Low** | Copy | NotFound says "Try one of the routes below." — there are no routes below, only a "Back home" button | `App.tsx:318` — add links or reword |
| 19 | **Low** | Consistency | Admin dashboard has 9 count tiles but **no "Destinations" tile**, even though `/admin/destinations` + 33 rows exist and the sidebar links it | `AdminDashboard` (`AdminPages.tsx:84`) + `adminCounts()` |
| 20 | **Low** | Copy | Tour operator named "El-Biyahe! Discovery Tours" (2 of 3 packages) — the app naming a third-party operator after itself is confusing for a referral-only product | `tour_operators` seed + live |
| 21 | **Low** | Copy | Passport spot "Los Baños Museum" — no such museum is well-established (there's the UPLB Museum of Natural History); verify or rename | `passport_locations` |
| 22 | **Low** | Cleanup | ~55% of `index.css` (and chunks of `elbiyahe.css`) is dead selectors for removed template pages: `.partner-*`, `.trip-*`, `.live-trip-*`, `.route-*`, `.wallet-*`, `.guides-*`, `.bundle-*`, `.plan-*`, `.poll-*`, `.happening-*`, `.stepper`, `.reservation-*`, `.generated-*`. No functional impact; large maintenance/confusion surface | strip unused rules from the 3 CSS files |
| 23 | **Low** | Copy | "ELBI Tester" test-account display name shows in the admin sidebar (test data, harmless, but visible) | update the tester profile's `display_name` |
| 24 | **Info** | Scope | Many "Explore" destinations are regional Laguna sites, not Los Baños proper (Pagsanjan Falls, Caliraya/Lumban, Rizal Shrine/Calamba, Seven Crater Lakes/San Pablo, Nuvali & Enchanted Kingdom/Santa Rosa). Pre-existing (the old hardcoded array was the same) — not introduced by this work, but the "Explore **Los Baños**" framing vs. "Laguna day trips" is worth a product call | — |

---

## Phase 11 — responsive / branding / guardrails

### Responsive sweep (`qa-responsive.mjs`)

- **#1 Explore overflow** — `anon__explore__768.png` (+357px), `__900` (+225px), `__1024` (+101px). Clean at ≤700 (mobile layout) and ≥1280. Bad band ≈ 715–1150px.
- **Every other public route: clean at all 7 widths.** Card grids collapse right, bottom nav clears content at the true page bottom, toast placement fine, no other horizontal scroll.
- **All 8 admin routes: clean at 820 / 1280 / 1440** (admin is desktop-only by design; #16 is the only admin nit).
- **#14** hero contrast at the 740–1000px range.

### Console / network

- **#3** — `Cannot update a component (ScrollToTop) while rendering a different component (Account)` on `anon-guard__account__*` and `anon-guard__saved__*` only. Redirect still works.
- **Zero** other console errors, zero `pageerror`, **zero `/assets` `/brand` `/scenes` responses ≥ 400** across the whole sweep. Image-404 check: **clean** (all 26 Phase-10 assets + brand + scene SVGs load).

### Branding / palette / fonts — clean

- No `Poppins` / `Playfair` / `Merriweather`, no pre-rebrand hex, no `kabiyahe` / bare `elbi` except the preserved "Elbi Community Sunday/Night Market" business names (`App.tsx:64-65`).
- **Exceptions found:** #5 (corrupted `El-Biyahe!YAHE-` demo codes), #15 (eyebrow "!"), #20/#23 (naming).

### Architecture guardrails — clean

- `useReserveTour` / `useReserveAccommodation` / `useToggleRsvp` / `useScanPassport`: DB row / RPC only, then `window.open()`. **No payment path.** ✓
- `season.is_current` and `event.status` are stored, not recomputed (#12 is the cost of that choice).
- **RLS verified:** anon insert into `event_rsvps` → `new row violates row-level security policy`. ✓

---

## Phase 12 — interaction / smoke / data-flow

### Interactive-element inventory (`qa-interactions.mjs`)

479 controls clicked across 13 routes. **40 raw "dead click" flags, triaged:**
- **37 false positives** — clicking an already-active filter pill / tab / view-toggle (functional, just a no-op when already selected), clicking a nav link to the current page, or an external `target="_blank"` link (opens a new tab, so the current page is unchanged — the script can't see it). Verified: "View Airbnb stays", "Check current details", "Subscribe" (blocked by `required` on empty email), the nav-name and "All"/"About"/"map"/"list"/"grid" flags are all benign.
- **1 low** — an unlabeled control on `home` and `dest-detail` produced no visible effect; likely a benign duplicate/decorative link. Verify during fixes.
- **Real → #4** — passport scan modal "did not close on Escape" (3 hits). Confirmed in source: `Modal` has no key handler.

### Overlay / z-index / scroll audit

- **Mobile menu** (`.mobile-drawer`, ≤700): opens from the right, all 10 links, closes on Escape and backdrop. ✓ (`overlay__mobile-menu__390.png`)
- **Passport scan modal**: opens centered, backdrop dims page, X and backdrop close it — **but not Escape (#4)**. Shows the corrupted demo codes (#5). (`overlay__passport-scan__390/1280.png`)
- **Explore "Filters"**: works at ≥1280 (rail already visible). **Dead at ≤700 (#2)** — `overlay__explore-filters__390.png` shows no panel appears.
- **Destination gallery strip**: thumbnails switch the hero + update the credit line. ✓ (Phase 10 screenshots)
- Filter pills on Delicacies / Stay&Eat / Parking: horizontally scrollable, intended.

### Write-flow smoke (`qa-writeflows.mjs`) — **8 / 8 PASS**

| Flow | Result |
|---|---|
| Sign in | PASS — lands on `/` |
| Event RSVP on | PASS — 1 `event_rsvps` row |
| Event RSVP off | PASS — 0 rows |
| Tour reserve | PASS — 1 `tour_reservations` + 1 `referral_events` |
| Accommodation reserve | PASS — 1 `referral_events` (but see #8 — no URL opens) |
| Passport scan (valid `ELBIYAHE-MUSEUM`) | PASS — 1 `passport_scans` row |
| Passport scan (invalid code) | PASS — rejected, toast shown, still 1 scan |
| RLS blocks anon RSVP insert | PASS — RLS policy violation |

No console errors during the run.

### Data-passage check

- Every public page renders real DB values (Events 8, Explore 33, Delicacies 4, Parking 3, Stay&Eat 3+4, Passport 4, Tours 3, Seasons — current = "El-Biyahe! Bañada").
- Forced errors: `/explore/bad-slug` and `/events/bad-slug` → clean "Couldn't find…" / `LoadError` empty state, **no white screen**.
- `/no-such-page` → NotFound renders (#18 is the only nit).

### Admin CRUD

Not exercised with throwaway rows in this pass (the plan's "catalog first" — this is the one deferred item). The admin list/read pages all render clean at 820/1280/1440; `Drawer` / `ImageField` / `RowsEditor` are present and typed. Recommend a create→edit→delete loop per table during the fix pass.

---

## Verification status

| Check | Result |
|---|---|
| `pnpm check` | **clean** |
| `pnpm build` | clean (Phase 10 commit `f43729e`; no source changed since) |
| `qa-responsive.mjs` | ran — findings #1, #3, #14 |
| `qa-interactions.mjs` | ran — finding #4 (rest false positives) |
| `qa-writeflows.mjs` | **8/8 PASS** |
| `scripts/e2e.mjs` | not re-run (superseded by `qa-writeflows.mjs`) |
| `pnpm test` | no test files (acceptable per plan) |

---

## Recommended fix batching (after your review)

1. `fix: responsive` — #1, #2, #14, #16 (all `index.css` / `admin.css` + the `.filter-rail.open` wiring)
2. `fix: correctness + a11y` — #3 (navigate in effect), #4 (Modal Escape + focus)
3. `fix: content + copy` — #5 (demo codes), #6 (scene captions → also fixes #10), #7 (passport /30), #8 (accom URL/toast), #12/#13/#20/#21/#23 (data), #11 (btn class), #15 (eyebrow), #17, #18, #19
4. `chore: css cleanup` — #22 (optional, larger)
5. `feat: /saved honest state` — #9 (minimum viable; full save-persistence is a separate effort)

Then: admin CRUD loop, re-run all three scripts, append to `progress.md`, merge to `main`.
