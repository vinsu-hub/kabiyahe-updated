# Photo checklist

Real photos still needed across the app. Tick one at a time as you source it — check the box,
save, commit whenever you like (this file has no build/CI dependency).

**Naming convention**: `elbiyahe-<kebab-case-subject>.jpg`, same as every existing photo in the
`vinsu-hub/el-biyahe-stock-images` GitHub Release (`v2.0.0`).

**Two ways to add a photo once sourced** (pick whichever fits — both are real, already-working
paths in this app, not a proposal):
1. **Formal pipeline** (used for the existing 21 destination photos — free-license only,
   Wikimedia Commons preferred, attribution tracked): add the file to a new release of
   `vinsu-hub/el-biyahe-stock-images` following the `elbiyahe-<slug>.jpg` name, add an entry to
   `scripts/destination-photo-manifest.json` (source/license/author), add the mapping to
   `IMAGE_BY_SLUG` in `scripts/seed-destinations.mjs` (or the equivalent seed script), re-run
   `pnpm db:seed`. Needed when the photo should carry public license attribution shown in-app.
2. **Admin panel upload** (simpler, no attribution tracking): sign in as admin → `/admin` → open
   the row (Destinations / Delicacies / Accommodations) → use the image field's Upload button.
   This goes straight to Supabase Storage, no git involvement, no `elbiyahe-*.jpg` naming needed.
   Fine for a personal/business photo you have direct rights to use (e.g. a café owner's own shot).

---

## Destinations — needs a first, dedicated photo (currently generic/shared fallback)

- [ ] `bato-resort` — Bato Resort → `elbiyahe-bato-resort.jpg`
- [ ] `diwata-nature-resort` — Diwata Nature Resort → `elbiyahe-diwata-nature-resort.jpg`
- [ ] `olivarez-plaza` — Olivarez Plaza → `elbiyahe-olivarez-plaza.jpg`
- [ ] `danielitos-home-kitchen` — Danielitos Home Kitchen → `elbiyahe-danielitos-home-kitchen.jpg`
- [ ] `malayas-cafe` — Malayas Cafe → `elbiyahe-malayas-cafe.jpg`
- [ ] `sol-y-viento-hotels-and-resorts` — currently shares the Hot Springs photo →
      `elbiyahe-sol-y-viento.jpg`
- [ ] `splash-mountain-resort` — currently shares the Hot Springs photo →
      `elbiyahe-splash-mountain-resort.jpg`
- [ ] `dampalit-falls` — currently shares the Makiling Trail photo →
      `elbiyahe-dampalit-falls.jpg`
- [ ] `seda-nuvali` — currently shares the Nuvali Lakeside photo → `elbiyahe-seda-nuvali.jpg`

Lower priority (both are generic-enough UPLB-campus subjects sharing one photo — nice to have,
not urgent):
- [ ] `sining-makiling-gallery` → `elbiyahe-sining-makiling-gallery.jpg`
- [ ] `philippine-carabao-center-at-uplb` → `elbiyahe-philippine-carabao-center.jpg`

## Accommodations — verify in Supabase Studio or `/admin` → Accommodations first

These 3 rows exist live in the database but weren't seeded from a tracked script, so their
current `hero_image` state can't be confirmed from the repo alone — check each row in the admin
panel before assuming a photo is missing.

- [ ] Trace Suites → `elbiyahe-trace-suites.jpg` (if still missing)
- [ ] City of Springs → `elbiyahe-city-of-springs.jpg` (if still missing)
- [ ] Anest Tower → `elbiyahe-anest-tower.jpg` (if still missing)

## Delicacies — all 14 rows currently share one generic food icon, none has a real photo

- [ ] Lety's Buko Pie → `elbiyahe-letys-buko-pie.jpg`
- [ ] Mer-Nel's Cake House → `elbiyahe-mer-nels-cake.jpg`
- [ ] DTRI Dairy Products → `elbiyahe-dtri-dairy-products.jpg`
- [ ] Los Baños Public Market Stalls → `elbiyahe-los-banos-public-market-stalls.jpg`
- [ ] IRRI Riceworld Coffee Shop → `elbiyahe-irri-riceworld-coffee-shop.jpg`
- [ ] Ben's Halo-halo & Ice Cream → `elbiyahe-bens-halo-halo-ice-cream.jpg`
- [ ] Cafe Lucca → `elbiyahe-cafe-lucca.jpg`
- [ ] Coffee Project → `elbiyahe-coffee-project-lb.jpg`
- [ ] Micha's Bakeshop → `elbiyahe-michas-bakeshop.jpg`
- [ ] Wildbreads → `elbiyahe-wildbreads.jpg`
- [ ] Satya Graha Cafe and Restaurant → `elbiyahe-satya-graha-cafe.jpg`
- [ ] Faustina's → `elbiyahe-faustinas.jpg`
- [ ] Bonitos Bar & Restaurant → `elbiyahe-bonitos-bar-restaurant.jpg`
- [ ] Nham Cha Thai Milk Tea → `elbiyahe-nham-cha-thai-milk-tea.jpg`

## Page hero banners

- [ ] Passport page hero (currently the generic `elbiyahe-hero.svg` illustration, no real photo)
      → `elbiyahe-passport-hero-banner.jpg`, or simplest: reuse the already-existing
      `elbiyahe-mount-makiling.jpg` (already in the stock set) — just needs the `<img src>` in
      `PassportHero` repointed to `/assets/elbiyahe-mount-makiling.jpg`, no new photo required.
- [ ] Stay & Eat page hero (currently the same generic `elbiyahe-hero.svg`) →
      `elbiyahe-stay-eat-hero-banner.jpg`, or a similar reuse of an existing stock photo if one
      fits well enough.

---

## No longer needed (do not source — superseded by this session's work)

`passport-todo.md`'s image checklist (§3) predates the Passport page rebuild and is now
obsolete — cross this whole section off if you're working from that file:
- ~~Per-location stamp badge SVGs~~ (`elbiyahe-stamp-<slug>.svg` × 4, locked-state treatment,
  mystery-state graphic) — the rebuilt Passport page uses a fully **procedural**, code-generated
  line-art `StampBadge` component instead (deterministic shape/color from each location's slug
  and category, zero image assets, all 3 states — collected/locked/mystery — drawn in code).
- ~~`elbiyahe-passport-seal.svg`~~ — built as an inline procedural `WaxSealMark` component.
- ~~`elbiyahe-skyline-motif.svg`~~ — built as an inline procedural `SkylineMotif` component.
