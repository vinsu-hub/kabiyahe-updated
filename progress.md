# Progress Log

## 2026-09-04 (Events page bug/oddity pass — branch `fix/events-page-oddities`, merged to `main`)
- Compared the live `/events` + `/events/:slug` pages against a user-supplied reference spec/mockups; user
  scoped this pass to real bugs/oddities only (no mockup-parity chase — Featured Event card, Newsletter,
  calendar widget, hero carousel etc. explicitly deferred).
- `useSeasonName()` now strips the `"El-Biyahe! "` brand prefix from season chip labels (was rendering
  "El-Biyahe! Makiling Enchanted" etc. verbatim into small tag chips).
- New `fallbackScene()` maps event category/slug to one of the 9 existing scene SVGs instead of every
  event falling back to the same generic `elbiyahe-hero.svg`.
- `EventCard` now shows a clamped description snippet (data was already fetched, just unused) and hides
  the attendee "going" count for `anytime` events (self-guided events had a meaningless "0 going").
- `EventsList` gained a search box, a sort control (soonest / most popular), and a results-count line;
  searching switches to a flat "Search results" list, browsing (no query) keeps the status-grouped view.
- `EventDetail`: `anytime` events (Heritage Walk, Sunset at the Park) no longer show the RSVP row or a
  fake going-count — swapped for a "Save for later" action. "Nearby Passport Spots" is now real —
  distance-sorted cards via `usePassport()` + `distanceKm()` (was a static, non-location-aware teaser
  banner) — falls back to the old generic banner when an event has no coords or nothing nearby.
- QA: `pnpm check`/`build` clean; Playwright verified season labels, search/sort, anytime-event RSVP
  suppression, 3 real nearby-passport cards on the Heritage Walk, RSVP still intact on scheduled events,
  0 console errors. `qa-writeflows.mjs` 8/8.

## 2026-09-04 (Explore LB-focus + real Events calendar + Heritage Walk — branch `feat/heritage-walk-events`)
- **Events tab is now the real Los Baños calendar.** `scripts/seed.mjs` events array rewritten to 11 real
  events (Bañamos Festival & 411th Founding Anniversary Sep 17–19, UPLB Loyalty Day, Flower & Garden Show,
  Makiling Enchanted Holidays, SyenSaya, UPLB Feb Fair, Likha, LB Raid Commemoration, Mt. Makiling trail
  activities, the Heritage Walk, Sunset at the Park) — 4 invented events dropped; seed now deletes stale
  slugs (7 removed). Seasons aligned to the doc names + `makiling-enchanted` set `is_current`
  ("September – December", Bañamos/Loyalty Day are its lead-ins).
- **New `anytime` event status** — migration `20260907090001_event_status_anytime.sql` (check constraint),
  `EventStatus` type, `EVENT_GROUPS` gets "Anytime in Los Baños" as the first group, admin status dropdown.
- **Heritage Walk is a real feature.** Migration `20260907090002_heritage_walk.sql` →
  `heritage_walk_stops` (public-read RLS). `scripts/seed-heritage-walk.mjs` seeds all 17 stops with
  verbatim guide blurbs, era groups, hand-sourced coords (17/17), passport flags. New `/heritage-walk`
  page (`HeritageWalk` in `ElbiyaheFeatures.tsx`): intro, 17-marker numbered map with a dashed route line
  (`LBMap` gained `routeLine`/`numbered` props), stops grouped by era with Directions links, "Make it a
  trip" cross-links. The Heritage Walk event detail links to it. `useHeritageWalk()` hook + `HeritageWalkStop` type.
- **Explore focuses on Los Baños.** Map opens centered on `LB_CENTER` z12.8; `fitBounds` only when the
  user searches/filters/sorts-nearby. Result list splits into "In Los Baños" then "Nearby Laguna day
  trips" via new `isLosBanos()` geo helper (~7 km of poblacion). Sub-copy updated.
- **Explore dead space filled** — new `.explore-map-aside` under the map: a 5-colour marker legend +
  a Heritage Walk callout card. `.map-field` is now column-flow in map view so the ~180px gap is gone.
- QA: `pnpm check` + `pnpm build` clean, `maplibre-gl` still a lazy async chunk. Playwright smoke of
  `/events` `/heritage-walk` `/explore` — all render, 17 markers on the walk map, 0 console errors.
  `qa-writeflows.mjs` 8/8 (updated: RSVP flow now targets a live event since Likha is a recap;
  `networkidle` → `load` for the live-map pages).

## 2026-09-04 (Real maps + Bañamos Festival + backlog — branch `feat/real-maps`, merged to `main`)
- **Real maps** replace every fake CSS "map" (gradient + randomly-positioned pins):
  - `MapLibre GL JS` + `react-map-gl` v8, basemap = OpenStreetMap standard raster (keyless, no billing;
    swap point noted in `todo.md`). OpenFreeMap vector was tried first but wouldn't render tiles in
    headless test browsers — raster is universal. CARTO now needs a key (dropped).
  - `client/src/components/LBMap.tsx` — one component for all surfaces: colour-coded markers, popups
    with View/Directions, fit-bounds, zone-circle overlays, opt-in user location, `ResizeObserver`
    keeps the canvas synced (react-map-gl misses container resizes on its own)
  - `MapView.tsx` lazy-loads it → `maplibre-gl` stays a 266 KB-gz **async** chunk, initial bundle
    unchanged at ~175 KB gz
  - `lib/geo.ts` — `useUserLocation` (opt-in, never auto-prompts), `distanceKm` haversine,
    `directionsUrl`, WebGL + reduced-motion guards; `getPosition` moved here from ElbiyaheFeatures
  - Wired: Explore map view (+ "Show near me" → sort list by distance), Events map view, Home
    mini-map, Destination/Event detail location cards + "Get directions", Tour detail itinerary map,
    Ride Guide tricycle-zone circles, Passport "Nearby stamps" distance-sort + per-row directions,
    Parking map + per-card Directions
  - a11y: `role=region` + label, focusable markers, Escape-closable popups, list stays the primary
    path, geolocation opt-in only, no-WebGL fallback link
- **Coordinates**: migration `20260906090001_geo` adds `lat`/`lng` to `destinations` +
  `tour_itinerary_stops`; `scripts/seed-geo.mjs` backfills real town/landmark coords for all 33
  destinations, 4 delicacies, 3 accommodations, 3 parking, 14 tour stops; stop coords also inlined in
  `seed.mjs` so a re-seed doesn't drop them
- **Bañamos Festival** — new headline event "25th Bañamos Festival & 411th Founding Anniversary"
  (Sep 17–19 2026, poblacion, `status: live`, theme "Honoring Heritage, Sustaining Traditions,
  Rekindling the Los Baños Spirit"). Shows top of `/events` under "Today" + on the Home strip
- **`todo.md`** at repo root — full organised backlog: (A) content to confirm, (B) missing features
  from the spec, (C) tech debt, (D) ops
- Verified: `pnpm check` + `build` clean, `maplibre-gl` in a lazy chunk, all 8 map surfaces render
  real markers at correct LB positions, `qa-writeflows` still 8/8, no console errors. Merged to
  `main`, pushed, Vercel redeploy


## 2026-09-04 (Phases 11 + 12 of the El-Biyahe! rebrand — QA sweep + batch fix, branch `rebrand/el-biyahe`)
- Built 4 QA scripts: `qa-responsive.mjs` (24 routes × 7 breakpoints, 150 screenshots, console/network capture), `qa-interactions.mjs` (every control clicked + overlay pass), `qa-writeflows.mjs` (all 5 write flows + DB row checks + RLS), `qa-admin-crud.mjs` (representative create/edit/delete + RLS). `QA-REPORT.md` catalogued 24 findings
- **All 8 write-flow checks pass** (RSVP on/off, tour reserve, accommodation reserve, passport scan valid+invalid, RLS blocks anon); admin CRUD create/delete + RLS pass; zero image 404s; only real console error was the guest-redirect one (fixed)
- **Batch fix — 3 commits**, user approved all findings:
  - `fix: responsive` — Explore's desktop-only layout now stacks ≤1150px and the mobile "Filters" button works (was dead — Tags/Price unreachable <700px); hero contrast in the 701–1050 band; admin nav at 820px
  - `fix: correctness/a11y/polish` — Account redirect moved to `useEffect` (was setState-in-render); `/saved` shows an honest empty state not a Profile clone; both modals close on Escape + `role=dialog`; passport demo codes `El-Biyahe!YAHE-*` → `ELBIYAHE-*`; passport `/30` → real count; Sign-out button class `button`→`btn`; NotFound quick links; honest no-URL reserve toast; card MapPin alignment; admin dashboard Destinations tile
  - `fix: scenes + seed data` — stripped baked caption text from all 10 scene SVGs + moved the sun blob off the hero action buttons + dropped leftover Poppins; demo world advanced to Sibol season / Sep 2026 (no more "LIVE NOW" on Feb dates); tour operator "El-Biyahe! Discovery Tours" → "Laguna Discovery Tours"; passport spot "Los Baños Museum" → "Old Los Baños Train Station"; hot-springs copy; accommodation `booking_referral_url`s set; test-account display names off "ELBI Tester"
- Re-verified: `pnpm check` + `pnpm build` clean; Explore no overflow at 768/900/1024/1200; mobile Filters reveals the rail; scan modal closes on Escape; no console errors; write flows still 8/8
- **Deferred** (documented, not blockers): #9 full save-persistence (SaveButton still local-only — `/saved` now honest); #22 dead-CSS cleanup (~55% of index.css, out-of-scope risk); #24 "Explore Los Baños" vs regional-Laguna-destinations framing (product call, pre-existing)
- Merged `rebrand/el-biyahe` → `main` and deployed to Vercel


## 2026-09-04 (Phase 10 of the El-Biyahe! rebrand — photo sourcing, on branch `rebrand/el-biyahe`)
- `gh auth` for `vinsu-hub` is now valid (user re-logged in), so Phase 10 unblocked
- Sourced **21 accurately-representative destination photos** from Wikimedia Commons (all free licenses: CC BY / CC BY-SA / CC0 / Public Domain) via the Commons API, replacing the 7 generic stock photos that had been shared across all 33 destinations. Destinations with no accurate free photo (bato-resort, the 2 placeholder cafes, diwata, splash-mountain, dampalit, sol-y-viento, olivarez) deliberately keep a generic Laguna image rather than a fabricated match — sol-y-viento/splash-mountain reuse the real Los Baños hot-spring photo since they are hot-spring resorts
- `scripts/destination-photo-manifest.json` — per-image source URL + license + author; `scripts/build-destination-photos.mjs` — downloads, resizes via `sharp` (added as devDep), packages the archive
- New **public repo `vinsu-hub/el-biyahe-stock-images`** + release **`v2.0.0`** (26 files: 21 new + 5 carried-over generics renamed `elbiyahe-*`, archive root `el-biyahe-stock-release/`, zip SHA-256 `de37a30…adac`). Old `kabiyahe-updated` `v1.0.0-stock-images` release kept as documented fallback
- `fetch-local-assets.mjs` repointed (new URL/SHA/FILES list, archive dir rename); `seed-destinations.mjs` now assigns photos by slug via `IMAGE_BY_SLUG` (legacy per-row image/gallery retained but ignored; note: `slugify()` doesn't transliterate ñ so "Los Baños" rows are `los-ba-os-*`); `App.tsx` `IMG.hero` → `elbiyahe-hero-losbanos.jpg` + new `PHOTO_CREDITS` map renders an attribution line under the destination-detail gallery
- `destinations` table `hero_image`/`gallery` updated live for all 33 rows; README asset section rewritten
- `pnpm check` + `pnpm build` clean; dev-server screenshots of `/explore` and `/explore/:slug` confirm distinct real photos load + credit line renders, no console/network errors
- Commit `f43729e`. **Still open**: minor copy mismatch (Los Baños Hot Springs description says "lush mountain landscape" but photo is a public mineral pool — cosmetic), full Phase 11 QA copy pass, pre-existing Explore tablet overflow (~900px). Branch still not merged to `main`


## 2026-09-04 (Phases 2-9 + partial 11 of the El-Biyahe! rebrand — continued on branch `rebrand/el-biyahe`)
- **Phase 2 (logos)**: cropped/resized the real logo set from `D:\El-Biyahe!\logos` (horizontal, mark-only, vertical) to web sizes, replaced the placeholder brand files at the same paths Phase 1 already pointed code at
- **Phase 3 (palette/fonts)**: loaded Plus Jakarta Sans + Space Grotesk via `index.html`, replaced all CSS tokens with the reference repo's confirmed hex values, added the semantic token set + season-accent tokens, swept remaining hardcoded old-palette hex literals (found via `git diff` reflection, not just grep)
- **Phase 4 (Delicacies)**: new `delicacies` Supabase table + RLS, `useDelicacies`/`useDelicacy` hooks, `AdminDelicacies` CRUD, real page replacing the ComingSoon stub, seeded with 4 municipal-guide-verified entries (Buko Pie, Mer-Nel's Cake, DTRI Dairy, Public Market)
- **Phase 5 (Stay & Eat)**: new `accommodations` table (Eat half reuses `delicacies`), referral-only `useReserveAccommodation` (logs `referral_events`, never processes payment — same pattern as Bus Tours), seeded Trace Suites/City of Springs/Anest Tower
- **Phase 6 (Parking)**: new `parking_spots` table (no reference design existed), seeded 3 real areas with honest "confirm on site" copy instead of fabricated fees
- **Phase 7 (Ride Guide)**: gap-checked against reference "Transpo" — added the one missing "Choose Your Ride" row; no data-model changes
- **Phase 8 (Bus Tours)**: confirmed it already inherited Phase 3's palette via generic classes; retargeted the one remaining hardcoded LIVE/warn red to `var(--destructive)`
- **Phase 9 (Explore migration)**: new `destinations` table, `scripts/seed-destinations.mjs` migrated all 33 previously-hardcoded records, rewired Explore/DestinationDetail/Home to Supabase, deleted the static array plus the already-dead `bundles`/`tripStops` arrays it exposed
- **Phase 10 (photo sourcing) — BLOCKED**: `gh auth` for `vinsu-hub` is invalid and needs an interactive re-login I can't do myself; user is handling this separately. Nothing else in the plan depends on it, so I proceeded past it.
- **Phase 11 (QA), started**: full-codebase + full-database sweep caught several branding leftovers the rename missed — a visible Passport reward description, two visible SVG scene labels baked into live event/tour hero images, a tour operator name and two event organizer names, one event slug — all fixed both live in Supabase and in the source scripts. Verified `pnpm check`/`pnpm build` clean after every commit. Responsive-checked Home/Delicacies/Stay & Eat/Parking/Explore at 390px and 900px — one **pre-existing, not introduced by this work** responsive gap found: the Explore page's search-row/view-toggle controls overflow at ~900px tablet width (CSS untouched by this pass). The "duplicated bottom nav" seen in early full-page mobile screenshots was a Playwright `fullPage` stitching artifact, confirmed not a real bug via a real-scroll screenshot.
- Not yet done: Phase 10's actual photo sourcing/publishing (blocked), full QA copy-accuracy pass against every remaining page, the pre-existing Explore tablet overflow (flagged, not fixed — out of this pass's introduced-bug scope)
- Branch `rebrand/el-biyahe` is NOT yet merged to `main` — recommend merging only after Phase 10 completes and the QA pass is fully closed out

## 2026-09-04 (Phase 1 of the El-Biyahe! rebrand — see ~/.claude/plans/iterative-hopping-moore.md)
- Started the approved 12-phase rebrand/completion/QA plan on new branch `rebrand/el-biyahe` (off `main` at `b8fb4df`)
- **Phase 1 complete**: full rename pass ELBI/Kabiyahe -> El-Biyahe!/`elbiyahe`, in 3 commits:
  - `8f266d4` elbi.css -> elbiyahe.css + main.tsx import
  - `e4fc3aa` CSS class sweep (.elbi-* -> .elbiyahe-*), JSX/comment text, ELBI_NAV/QUICK idents, kabiyahe:notice event, ELBI- QR prefixes, brand/scenes asset file renames, ElbiFeatures.tsx -> ElbiyaheFeatures.tsx, regenerated scene SVGs with corrected wordmark
  - `0a5863a` package.json name, env var renames, README + script updates (fetch-local-assets.mjs, seed.mjs, make-placeholder-art.mjs, e2e.mjs, guides-flow-check.mjs)
- Deleted dead code: `client/src/lib/assets.ts` (`assetPath()` had zero call sites) and the orphaned `kabiyahe-emblem_04426ca6.png`
- **Live Supabase writes** (user-approved): fixed 11 `events`/`tour_packages` rows and the `banada` season name whose `hero_image`/`name` referenced pre-rename asset paths/text; fixed 4 `passport_locations` QR codes (`ELBI-*` -> `ELBIYAHE-*`) to match the updated in-app demo-code hint text
- Deliberately left alone: `Elbi Community ...Market` (real third-party business names), the GitHub release repo `vinsu-hub/kabiyahe-updated` and its `kabiyahe-*.jpg` asset filenames (deferred to Phase 9/10 — needs `gh auth login`, current token is invalid), the `elbi-tester@example.com` e2e test credentials (couldn't verify if that Supabase Auth user already exists under the old email — admin.listUsers() call got blocked by the permission classifier)
- Verified after every commit: `pnpm check` and `pnpm build` clean; booted `pnpm dev` and spot-checked `/`, `/events`, `/passport`, `/admin`, `/login` (200) plus renamed brand/scene asset URLs (200)
- Next: Phase 2 (swap in the real logo files from `D:\El-Biyahe!\logos`) through Phase 11 (QA pass) remain — this is a multi-session effort, pausing here to check in with the user before continuing

## 2026-09-04 11:35
- Resumed post-power-outage: verified `main` was clean and up to date at `b8fb4df` (no lost work — last commit had already landed before the outage)
- Confirmed prior work: 8 stock photos published to GitHub Release `v1.0.0-stock-images`, `scripts/fetch-local-assets.mjs` rewritten to fetch/verify/extract them into `client/public/assets/` (gitignored), Home/DestinationDetail restored to richer original layout on ELBI branding
- Found `.env.local` was missing `VITE_KABIYAHE_LOCAL_ASSETS=true`, so `lib/assets.ts` was still resolving images to the dead `/manus-storage/` host instead of local `/assets/` — added the flag (not committed; `.env.local` is gitignored, local-only)
- Verified: `pnpm check` (tsc) clean, `pnpm build` clean (only the known large-bundle advisory), `pnpm test` reports no test files (expected — ELBI was bootstrapped fresh from the Kabiyahe template on frontend-only mock data, old Kabiyahe test suite doesn't apply post-rebrand)
- Booted `pnpm dev`, confirmed homepage (200) and hero image (`/assets/kabiyahe-hero-laguna_e334210c.jpg`, 200) load correctly with the fix
- Created `~/.claude/skills/progress-log/SKILL.md` so future sessions auto-log finished work here
- Next: no open task specified yet — awaiting direction on what to build/fix next in ELBI
