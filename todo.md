# El-Biyahe! — open backlog

Snapshot of what still needs confirming or building after the rebrand + Phase 11/12 QA + the
real-maps pass. Sizes: **S** ≈ hours · **M** ≈ a day · **L** ≈ multi-day.

Live: https://el-biyahe.vercel.app · repo `vinsu-hub/kabiyahe-updated` · Supabase `isxqekiofkgovbgbscpn`

---

## A. Content to confirm / verify

Most launch content is *plausible* but not sourced from the LGU / venues. Before this is shown as
anything but a demo, confirm:

- [ ] **Season model vs real festivals** — "El-Biyahe! Bañada" (Q1/Feb) is invented; the real Los Baños
      festival is **Bañamos** (September, founding anniversary — now seeded as an event). Decide whether
      the 4 "seasons" map to real LB event clusters or stay as a product device. **M**
- [ ] **Passport rewards** — "10% Off Local Partner Voucher", "Free buko pie slice — Buko Pie House":
      real partner agreements, or placeholder copy? **S**
- [ ] **Tour operators & packages** — Laguna Heritage Coaches, Laguna Discovery Tours, the 3 packages,
      prices, schedules, `reserve_url`s (currently `example.com/...`). Real or illustrative? **M**
- [ ] **Accommodations** — Trace Suites / City of Springs / Anest Tower: price ranges, amenities,
      real booking channels (referral URLs are Google-search links). Photos also needed —
      see `photo-checklist.md` (their `hero_image` state needs live-DB verification first, no
      tracked seed script exists for this table). **S**
- [ ] **Delicacies / parking / passport-spot specifics** — DTRI hours, Mer-Nel's, buko-pie stalls;
      parking fees & capacity; who hosts each passport QR. **M**
- [ ] **Fabricated numbers** — every event `attendee_count`, every destination `rating` /
      `review_count`. Decide a policy: hide ratings until a real reviews system exists? **S**
- [ ] **Ride Guide** — jeepney fares, frequencies, routes, tricycle zone fares vs current LB reality. **S**
- [ ] **"Explore Los Baños" framing** — ~15 of the 33 destinations are regional Laguna (Pagsanjan,
      San Pablo, Santa Rosa, Calamba). Reframe as "Los Baños & nearby", or split the catalog. **S**
- [ ] **Photos** — full tickable checklist now in `photo-checklist.md` (10 destinations, all 14
      delicacies — bigger gap than previously tracked, accommodations pending live-DB check, 2
      page hero banners). Passport's stamp-art needs are obsolete/removed from that list — the
      rebuilt Passport page uses procedurally-generated line-art badges, no images needed. **M**
- [ ] **Leftover brand string** — `scan_passport()` still returns "…not a valid ELBI Passport QR." **S**
- [ ] **"Old Los Baños Train Station" passport spot** — confirm it's a real visitable heritage stop
      with a QR host (renamed from the dubious "Los Baños Museum"). **S**

## B. Missing features (from `project context/ELBI-FINAL-FEATURE-LIST.md`)

- [ ] **Save / bookmark persistence** — `SaveButton` is local `useState`; `/saved` is an empty state.
      Needs a `saved_items` table + hooks + the real Saved grid. **M**
- [ ] **Community feed** — announcements, recaps, photos/videos, user spot reviews; follow
      teams/artists/barangays/partners; likes & comments. **L**
- [ ] **Reviews system** — real ratings/reviews for destinations, tours, delicacies, stays
      (all current ratings are seed data). **L**
- [ ] **Global search** — across events / places / food / tours (feature list 1.12). **M**
- [ ] **Newsletter** — signup currently only fires a toast; needs storage + a send path. **S**
- [ ] **Push notifications** — event reminders, passport reward alerts, tour departure reminders. **L**
- [ ] **Passport depth** — send GPS coords on *manual* code entry (server check exists, UI doesn't
      pass them). Tier progression UI (Explorer→Local Insider→Completionist) is now real (DB-side
      leveling via `award_passport_xp()`, wired into both `scan_passport` and `claim_mission`) —
      season-track UI (tying passport progress to the 4-season model) is still not built. **S**
- [ ] **Partner portals** — Vendor, Hospitality partner, Tour operator, Organizer onboarding +
      dashboards + claim flows. None exist. **L** each
- [ ] **Super-admin** — vendor/partner/operator review queues, user & role management, sponsor
      management, audit log. **L**
- [ ] **Offline caching** — Ride Guide + Parking data for low-signal Makiling areas. **M**
- [ ] **Verify "Continue with Google"** actually completes the OAuth round-trip in production with a
      real Google account — the `redirectTo`-drops-`?next=` bug is fixed (now uses
      `window.location.href`) and the button now has a busy state + surfaces errors, but nobody has
      clicked it through with a real Google login yet. **S**
- [ ] **Ride Guide "Terminal Guide"** — only 1 real, web-sourced terminal is wired up (Olivarez
      Plaza jeepney terminal, with real animated routing) — everything else still says "Coming
      soon." More real jeepney/tricycle terminal coordinates need sourcing (couldn't verify more
      via web search in one session) before expanding this. **M**

## C. Tech debt / polish

- [x] **Responsive scaling pass** (2026-09-08) — fixed: no nav in the 701–900px band
      (hamburger now revealed at ≤900 to match `elbiyahe.css`'s nav hide); `maximum-scale=1`
      removed from the viewport meta (pinch-zoom); `html,body{overflow-x:clip}` safety net;
      `.admin-table` now scrolls instead of overflowing 820–1100px; Space Grotesk 400 weight
      now actually loaded (headings were faux-synthesized); `.empty-state` given real CSS;
      Explore/DestinationDetail loading now use the shared `<Loading>` spinner; the 4
      hand-rolled feature-page modals now close on Escape (`useDismissable`). Full
      `qa-responsive.mjs` sweep: 0 overflow at 375–1440 on every live + admin route.

- [ ] **Dead CSS** — ~55% of `index.css` is selectors for removed template pages (`.partner-*`,
      `.trip-*`, `.live-*`, `.route-*`, `.wallet-*`, `.bundle-*`, `.plan-*`, `.happening-*`, `.stepper`,
      `.reservation-*`, `.guides-*`). Strip. **M**
- [ ] **Bundle size** — `index-*.js` is 618 KB (173 gz) with a Vite size warning. Code-split routes;
      the map is already lazy-loaded. **M**
- [ ] **No tests** — `vitest` has zero test files. Add hook-shape + smoke tests. **M**
- [ ] **Unused dep** — `@types/google.maps` devDependency (map is MapLibre now). **S**
- [x] **Explore card inconsistency** — unified: one `<Rating>` component
      (`client/src/components/Rating.tsx`) shows `★ N (count)` everywhere, renders nothing when
      the seed value is null. Replaced 8 ad-hoc treatments; removed orphaned `.reviews-coming-soon`
      CSS. (Ratings-policy in A is still open — these are still seed numbers.)

## D. Ops / deploy

- [ ] **Rename the app repo** `vinsu-hub/kabiyahe-updated` → `el-biyahe` (Vercel git connection +
      any release URLs follow). **S**
- [ ] **Custom domain** on Vercel. **S**
- [ ] **SEO / social** — `<title>`, meta description, and OG image are still template defaults
      (`client/index.html`). Add per-route titles. **S**
- [ ] **Analytics** — none wired. **S**
- [ ] **Supabase** — project naming; consider a staging vs prod split if the demo continues. **S**
- [ ] **Map tiles** — basemap is still OpenStreetMap standard raster (keyless, but OSMF's tile
      policy discourages heavy app use) — `MAP_STYLE` in `client/src/components/LBMap.tsx` is the
      only change point if this needs to move to a keyed provider. Note: Mapbox is now used for
      real routing (Directions API only, `VITE_MAPBOX_TOKEN`, see Done) — the basemap itself was
      deliberately kept on OSM rather than switched to Mapbox tiles. **S**
- [ ] **Delicacy suggestions have no admin UI yet** — the Delicacies page's "Add a Recommendation" CTA
      writes real rows to `delicacy_suggestions` (name/place/note/submitted_by), but there's no
      `/admin/...` page to review them yet — admins currently need Supabase Studio. **S**
- [ ] **Street Food category has 0 real Los Baños items** — no verifiable named street-food vendor was
      found during the Delicacies research pass; the category exists in the filter/taxonomy but its
      themed row stays hidden until a real one is sourced. **S**

---

## Done

- ✅ Full ELBI/Kabiyahe → El-Biyahe! rebrand (Phases 1–3)
- ✅ Delicacies / Stay & Eat / Parking built out; Explore migrated to Supabase (Phases 4–9)
- ✅ 21 accurate destination photos, published as `vinsu-hub/el-biyahe-stock-images` v2.0.0 (Phase 10)
- ✅ Responsive / interaction / data-flow QA sweep + 24-finding batch fix (Phases 11–12)
- ✅ Deployed to Vercel with SPA rewrites + build-time asset fetch
- ✅ Real MapLibre maps across Explore / Events / detail pages / Home / Ride Guide / Passport
- ✅ Bañamos Festival event seeded
- ✅ Stay & Eat page rebuilt toward the local-discovery-directory mockup (shared `VenueCard`,
     real mini-map, honest trust strip)
- ✅ Passport page fully rebuilt — real DB-side XP leveling, missions + claim RPC, procedural
     stamp art, honest leaderboard, restyled rewards; grew stamps 4→9 with real sourced locations
- ✅ Real animated road-following routing (Mapbox Directions) on Parking + one real Ride Guide
     terminal — map tiles stay free/keyless OSM, only route geometry uses Mapbox
- ✅ Sign Up / Login rebuilt as a split-screen onboarding page; fixed a real Google-OAuth
     `?next=` redirect bug
- ✅ Fixed a real production bug: category-based Passport mission progress silently read 0 for
     every non-admin user (RLS-restricted embed) — now fixed and verified against a plain account
