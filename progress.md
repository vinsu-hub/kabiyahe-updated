# Progress Log

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
