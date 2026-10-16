# El-Biyahe! site evaluation (2026-10-16)

Sources:
- A Playwright crawl of the current build (15 public routes at 1440px).
- Screenshots with real data taken on 2026-09-27, while the new Supabase project was still reachable.
- A code review of `client/src` and `scripts/`.

## 1. Connections (backend and external links)

| # | Finding | Severity | Notes |
|---|---|---|---|
| C1 | **The site has no reachable backend.** Production still points at the deleted project `isxqekiofkgovbgbscpn`, and the replacement `gwwweoiqgiiabegemrmz` now returns NXDOMAIN too. The stored management token returns 401 (rotated). | Blocker | Free-tier projects pause after ~7 days without traffic. Restore or recreate the project, run `pnpm db:restore`, and set the Vercel env vars. Then keep it active (upgrade, or a keep-alive ping). |
| C2 | **Vercel env vars** were never switched to the new project. The local CLI is logged into the wrong account (Varix). | Blocker | See `HANDOFF.md`, step 1. |
| C3 | **Tour bookings link to `example.com`.** All 7 tour packages come from 2 seeded, apparently invented operators (Laguna Heritage Coaches, Laguna Discovery Tours) with 11 seeded reviews and seeded prices. | High | Replace with real operators, or hide Bus Tours "Reserve" until partners are onboarded. Fake reviews and booking links mislead visitors. |
| C4 | Google sign-in is disabled on the new project. | High | Needs the Google OAuth client ID and secret in Supabase Auth → Providers. |
| C5 | No admin account exists in the new DB. | Medium | Promote the first sign-up to `admin`. |
| C6 | **Terms and Privacy links on sign-up are dead** (`href="#"`). | High | Needs legal pages before launch, especially because accounts collect email. |
| C7 | **No Open Graph or Twitter meta tags**, so shared links have no preview image. | Medium | Being fixed: worker I1 adds an OG image and tags. |

## 2. Missing or stubbed features

| # | Feature | Where | State |
|---|---|---|---|
| F1 | Global search | Header search pill | Shows a "coming soon" toast, so the control looks usable but does nothing. Wire it to destinations, events and delicacies, or hide it. |
| F2 | Notifications | Header bell | Always says "You're all caught up". It isn't linked to the event updates or RSVPs that already exist in the DB. |
| F3 | Newsletter | Home + Events rail | Home's Subscribe accepts an email, then says "signup is not available yet" and discards it. The Events rail input is disabled ("coming soon"). There's no backing table or email provider. |
| F4 | Stay & Eat listings | `/stay-eat` | The DB has 0 accommodations (they were never in the seed). Re-enter them via the admin panel, or add a seed. |
| F5 | Parking rules / Ride Guide operating hours | `/parking`, `/ride-guide` | Rows are marked "Coming soon". |
| F6 | Destination location pins | `/explore/:id` | Some places show "Location pin coming soon". |
| F7 | Passport stamp locations | `/passport` | Shows "Stamp locations are coming soon" when the table is empty. 9 locations are seeded. |
| F8 | Partner dashboards (vendor, hospitality, tour operator, organizer) | Board 06 | Not built. Admin only. |
| F9 | Season dates | Seasons data | Need client confirmation. Q4 (Sep–Dec) overlaps Q3. |

## 3. UI and UX

| # | Finding | Fix |
|---|---|---|
| U1 | **Every Delicacies card and Ride Guide route card shows the same mountain placeholder art.** Seeded rows carry `/scenes/*.svg`, so the photo fallback never triggers. | Being fixed: I1 (14 delicacy photos + `delicacyImage()`), I2 (route image mapping). |
| U2 | Heritage Walk is a long text-only list of 17 stops. | Being fixed: I2 adds passport-style stamp illustrations per stop. |
| U3 | The error and empty states are text only. | Being fixed: I2 adds "offline" and "empty" spot illustrations. |
| U4 | Delicacies stacks 8 category rails in one very long page, while the board shows 2 rails plus a right rail. | Collapse to Local Favorites + Street Food rails, with a "See all" per category. |
| U5 | Events are almost all "Community" in category, so the category filter barely filters. | Recategorise the seed (Culture, Arts, Education, Environment). |
| U6 | The search pill and bell (F1, F2) are visible controls that don't do what they suggest. | Implement or remove. Don't leave decoy controls. |
| U7 | Mobile layouts pass the overflow and alignment checks (PR #2). Tap targets are fine except where already fixed. | No action needed. |

## 4. Images being generated (Orca run `run_13b98cc8a108`, Codex)
- **I1:** 14 delicacy photos, 4 Stay & Eat category fallbacks, and an OG share image (logo composited, not AI text), plus meta tags.
- **I2:** 17 Heritage Walk stamp illustrations, "offline" and "empty" state illustrations, and Ride Guide route image mapping (existing photos).

## 5. Final UI/UX craft review (Emil Kowalski design-engineering lens, 2026-10-16)

**What's already right:**
- No `transition: all`.
- No `ease-in` on UI.
- Nothing animates in from `scale(0)`.
- There's a strong custom `--ease-out: cubic-bezier(.23,1,.32,1)`.
- Modals enter from `scale(.97)` + opacity in 180ms, with a centred origin.
- The profile menu uses `transform-origin: top right`.
- `.btn` has `:active` press feedback.
- `prefers-reduced-motion` is respected.

| Before | After | Why |
| --- | --- | --- |
| `main { animation: page-reveal 480ms }` (12px rise) on **every route change** | Opacity-only, 150ms, or no animation | Navigation happens tens of times per session. A 480ms rise makes every page feel slow, and it's over the 300ms UI ceiling. |
| Card image hover zoom `transition: transform 600ms` | `transform 250ms var(--ease-out)` | Hover is frequent. 600ms feels laggy and keeps zooming after the pointer has left. |
| 27 `:hover { transform }` rules (cards, `.btn`, pins, chips) applied unconditionally | Wrap them in `@media (hover: hover) and (pointer: fine)` | On phones a tap triggers hover, so cards jump and stay lifted after you tap them. |
| No `:active` state on the new shell controls: search pill, bell `.icon-btn`, `ChipGroup`, Explore chips, Stay & Eat tabs, Events list/map toggle, listing-card heart, rail arrows | `transform: scale(.97)` on `:active`, with `transition: transform 160ms var(--ease-out)` | Only the legacy `.btn` "hears" a press. The new UI feels dead to touch by comparison. |
| `.btn { transition: transform .16s }` (default `ease`) | `transform 160ms var(--ease-out)` | The default curve is too weak. Use the project's own strong ease-out token so all presses feel the same. |
| Toast: `@keyframes notice-in`, no exit, and every `notify()` starts a new 2.6s `setTimeout` that is never cleared | Transition with `@starting-style`, a 150ms fade exit, one cleared timer per toast, and a pause while the tab is hidden | Rapid saves restart the keyframe, and an older timer hides a newer toast early. Toasts vanish instantly instead of leaving. (Sonner principles 4 and 5.) |
| Mobile drawer `drawer-in`: `opacity .3 → 1`, `translateX(26px)`, unmounts instantly | Enter from `translateX(100%)` with `cubic-bezier(.32,.72,0,1)` in about 300ms; exit 200ms back to `translateX(100%)` | A side drawer should come from its edge. A half-opacity jump plus an instant close looks broken. |
| Home hero image `hero-image-in 900ms` | About 400ms, opacity + `scale(1.02 → 1)` | It's the first thing visitors see. 900ms delays the main image and feels slow on every visit to Home. |
| Hero CTAs `rise-in 420ms`, both at once | 300ms with a 50ms stagger between buttons | Stays under the ceiling, and the stagger reads as more deliberate than both appearing together. |
| Map pins `pin-pop 500ms`, replayed on every filter change; pin hover `scale(1.14)` ungated | 200ms, only on first mount; hover gated to fine pointers | Filtering is frequent. Pins popping again on every keystroke is noisy. |
| Reduced motion: global `animation:none; transition:none` | Keep 150ms opacity fades and remove only movement | Reduced motion should mean gentler, not none. Fades still help people follow state changes. |
| Header search pill and bell look interactive but only show toasts | Wire them up, or remove them until they work | These decoy controls undermine trust in every other control. |
| Delicacies: 8 stacked category rails, very long page | Local Favorites + Street Food rails, with "See all" per category (as on the board) | Too much choice on one screen. The board's 2-rail layout scans faster. |
| Events: almost every event is "Community" | Recategorise the seed (Culture, Arts, Education, Environment…) | A filter that doesn't narrow anything is a broken control in disguise. |

**Priority:** 1. press states + hover gating (one CSS pass); 2. page-reveal and image-hover timings; 3. toast host rewrite; 4. drawer; 5. the decoy controls and content fixes.
