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
      real booking channels (referral URLs are Google-search links). **S**
- [ ] **Delicacies / parking / passport-spot specifics** — DTRI hours, Mer-Nel's, buko-pie stalls;
      parking fees & capacity; who hosts each passport QR. **M**
- [ ] **Fabricated numbers** — every event `attendee_count`, every destination `rating` /
      `review_count`. Decide a policy: hide ratings until a real reviews system exists? **S**
- [ ] **Ride Guide** — jeepney fares, frequencies, routes, tricycle zone fares vs current LB reality. **S**
- [ ] **"Explore Los Baños" framing** — ~15 of the 33 destinations are regional Laguna (Pagsanjan,
      San Pablo, Santa Rosa, Calamba). Reframe as "Los Baños & nearby", or split the catalog. **S**
- [ ] **Photos** — 6 destinations still on a generic Laguna image (bato-resort, diwata-nature-resort,
      splash-mountain-resort, dampalit-falls, sol-y-viento, olivarez-plaza) + 2 placeholder cafés
      (Danielitos, Malayas Cafe). Source real photos or drop the rows. **M**
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
      pass them); tier progression UI (Explorer→Local Insider→Completionist); season-track UI. **M**
- [ ] **Partner portals** — Vendor, Hospitality partner, Tour operator, Organizer onboarding +
      dashboards + claim flows. None exist. **L** each
- [ ] **Super-admin** — vendor/partner/operator review queues, user & role management, sponsor
      management, audit log. **L**
- [ ] **Offline caching** — Ride Guide + Parking data for low-signal Makiling areas. **M**
- [ ] **Verify "Continue with Google"** actually completes the OAuth round-trip in production. **S**

## C. Tech debt / polish

- [ ] **Dead CSS** — ~55% of `index.css` is selectors for removed template pages (`.partner-*`,
      `.trip-*`, `.live-*`, `.route-*`, `.wallet-*`, `.bundle-*`, `.plan-*`, `.happening-*`, `.stepper`,
      `.reservation-*`, `.guides-*`). Strip. **M**
- [ ] **Bundle size** — `index-*.js` is 618 KB (173 gz) with a Vite size warning. Code-split routes;
      the map is already lazy-loaded. **M**
- [ ] **No tests** — `vitest` has zero test files. Add hook-shape + smoke tests. **M**
- [ ] **Unused dep** — `@types/google.maps` devDependency (map is MapLibre now). **S**
- [ ] **Explore card inconsistency** — some show "Reviews coming soon", some a rating number
      (falls out of the ratings-policy decision in A). **S**

## D. Ops / deploy

- [ ] **Rename the app repo** `vinsu-hub/kabiyahe-updated` → `el-biyahe` (Vercel git connection +
      any release URLs follow). **S**
- [ ] **Custom domain** on Vercel. **S**
- [ ] **SEO / social** — `<title>`, meta description, and OG image are still template defaults
      (`client/index.html`). Add per-route titles. **S**
- [ ] **Analytics** — none wired. **S**
- [ ] **Supabase** — project naming; consider a staging vs prod split if the demo continues. **S**
- [ ] **Map tiles** — currently OpenStreetMap standard raster (keyless, but OSMF's tile policy
      discourages heavy app use). If traffic grows, move to a keyed provider (MapTiler / Protomaps /
      self-hosted) — `MAP_STYLE` in `client/src/components/LBMap.tsx` is the only change point. **S**

---

## Done

- ✅ Full ELBI/Kabiyahe → El-Biyahe! rebrand (Phases 1–3)
- ✅ Delicacies / Stay & Eat / Parking built out; Explore migrated to Supabase (Phases 4–9)
- ✅ 21 accurate destination photos, published as `vinsu-hub/el-biyahe-stock-images` v2.0.0 (Phase 10)
- ✅ Responsive / interaction / data-flow QA sweep + 24-finding batch fix (Phases 11–12)
- ✅ Deployed to Vercel with SPA rewrites + build-time asset fetch
- ✅ Real MapLibre maps across Explore / Events / detail pages / Home / Ride Guide / Passport
- ✅ Bañamos Festival event seeded
