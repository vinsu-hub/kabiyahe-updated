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
