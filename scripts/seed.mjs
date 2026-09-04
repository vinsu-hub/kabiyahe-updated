/* Seed the El-Biyahe! Supabase project with the launch content.
   Mirrors client/src/lib/elbiData.ts. Uses the secret key (bypasses RLS).
   Run: node --env-file=.env.local scripts/seed.mjs
   Idempotent: upserts by natural key, clears child tables first. */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY (use --env-file=.env.local)");
const db = createClient(url, key, { auth: { persistSession: false } });

const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message); process.exit(1); } };
const scene = (n) => `/scenes/elbiyahe-${n}.svg`;

/* ---------------- seasons ----------------
   Four-season programming model (from ELBI-Complete-Context §9). Demo "now" is
   mid-September, which is Makiling Enchanted's lead-in phase — Bañamos (Sep 17) and
   UPLB Loyalty Day (Oct) run into the December finale. */
const seasons = [
  { key: "banada", quarter: "Q1", name: "El-Biyahe! Bañada", months: "February", pillars: "Art · Heritage · Culture", blurb: "Celebrate art, heritage, and culture across Los Baños.", is_current: false, sort: 1 },
  { key: "sol-open", quarter: "Q2", name: "El-Biyahe! Sol Open", months: "April", pillars: "Nature · Sport · Wellness", blurb: "Get outdoors — nature, sport, and wellness around Mt. Makiling.", is_current: false, sort: 2 },
  { key: "sibol", quarter: "Q3", name: "El-Biyahe! Sibol Weekend Market", months: "July", pillars: "Ideas · Innovation · Enterprise", blurb: "Discover local ideas, innovation, and enterprise in Los Baños.", is_current: false, sort: 3 },
  { key: "makiling-enchanted", quarter: "Q4", name: "El-Biyahe! Makiling Enchanted", months: "September – December", pillars: "Community · Tradition · Celebration", blurb: "Honoring heritage, sustaining traditions, rekindling the Los Baños spirit.", is_current: true, sort: 4 },
];
die("seasons", (await db.from("seasons").upsert(seasons, { onConflict: "key" })).error);
console.log(`✓ seasons (${seasons.length})`);

/* ---------------- events ----------------
   The real Los Baños community calendar (from the Municipality's "Discover Los Baños"
   guide p.9 + ELBI-Complete-Context §9–10). No invented events. */
const events = [
  // ---- Anytime: self-guided / recurring ----
  { slug: "los-banos-heritage-walk", title: "Los Baños Heritage Walk", category: "Culture", season_key: "banada", status: "anytime",
    date_label: "Self-guided · anytime", time_label: "~2.5 km on foot", venue_name: "Immaculate Conception Parish, Poblacion", barangay: "Poblacion",
    lat: 14.1772, lng: 121.2170, attendee_count: 0, hero_image: scene("heritage"), organizer: "Los Baños Tourism Office",
    description: "A 17-stop self-guided walking tour through the places that shaped Los Baños — from the 1613 Immaculate Conception Parish and the ruins of Agua Santa Resort to the old train station, Baker Hall, and the hot springs that gave the town its name.",
    schedule: [], updates: [] },
  { slug: "sunset-at-the-park", title: "Sunset at the Park", category: "Community", season_key: null, status: "anytime",
    date_label: "Every weekend", time_label: "Late afternoon till evening", venue_name: "Old Pantalan, Los Baños", barangay: "Bayog",
    lat: 14.1793, lng: 121.2430, attendee_count: 600, hero_image: scene("sunset"), organizer: "Los Baños Tourism Office",
    description: "The town's newest weekend destination at Old Pantalan on Laguna de Bay — live performances, bazaars, and local products every weekend, year-round.",
    schedule: [], updates: [] },

  // ---- Now: Makiling Enchanted lead-in ----
  { slug: "banamos-festival-2026", title: "25th Bañamos Festival & 411th Founding Anniversary", category: "Community", season_key: "makiling-enchanted", status: "live",
    date_label: "Sep 17–19, 2026", time_label: "All day", venue_name: "Los Baños Town Proper (Poblacion)", barangay: "Timugan / Poblacion",
    lat: 14.1699, lng: 121.2168, attendee_count: 5000, hero_image: scene("heritage"), featured: true,
    starts_at: "2026-09-17T00:00:00+08:00", ends_at: "2026-09-19T23:59:00+08:00",
    organizer: "Municipal Government of Los Baños",
    description: "The celebration is back, Los Bañenses! A grand civic parade, street dancing, and science exhibits marking the 25th Bañamos Festival and the 411th Founding Anniversary of Los Baños. This year's theme: \"Honoring Heritage, Sustaining Traditions, Rekindling the Los Baños Spirit.\"",
    schedule: [
      { time_label: "Sep 17", item: "Opening parade & civic program", state: "done", sort: 1 },
      { time_label: "Sep 18", item: "Street dancing, cultural night & talent showcase", state: "live", sort: 2 },
      { time_label: "Sep 19", item: "Founding anniversary rites, science exhibits & community fair", state: "next", sort: 3 },
    ],
    updates: [{ ago_label: "just now", body: "Festival week is here — check the calendar, save the dates, and be part of the celebration. Full schedule at the town plaza." }] },

  // ---- This month: October ----
  { slug: "uplb-loyalty-day", title: "UPLB Loyalty Day", category: "Community", season_key: "makiling-enchanted", status: "week",
    date_label: "October 2026", time_label: "Whole day", venue_name: "UPLB Campus", barangay: "Batong Malake",
    lat: 14.1650, lng: 121.2410, attendee_count: 3000, hero_image: scene("campus"),
    starts_at: "2026-10-01T00:00:00+08:00", ends_at: "2026-10-31T23:59:00+08:00",
    organizer: "University of the Philippines Los Baños",
    description: "The annual UPLB alumni homecoming — a campus parade, reunions across the colleges, and the Flower and Garden Show along the university's tree-lined avenues.",
    schedule: [], updates: [] },
  { slug: "flower-and-garden-show", title: "Flower & Garden Show", category: "Community", season_key: "makiling-enchanted", status: "week",
    date_label: "October 2026", time_label: "Daytime", venue_name: "UPLB Campus (with Loyalty Day)", barangay: "Batong Malake",
    lat: 14.1655, lng: 121.2405, attendee_count: 1500, hero_image: scene("food"),
    starts_at: "2026-10-01T00:00:00+08:00", ends_at: "2026-10-31T23:59:00+08:00",
    organizer: "Los Baños Horticultural Society (LBHSI)",
    description: "Organized by the Los Baños Horticultural Society alongside UPLB Loyalty Day — native and exotic ornamental plants, orchids, and gardening supplies from local nurseries.",
    schedule: [], updates: [] },

  // ---- This season: December finale ----
  { slug: "makiling-enchanted-holidays", title: "Makiling Enchanted Holidays", category: "Community", season_key: "makiling-enchanted", status: "season",
    date_label: "December 2026", time_label: "Evenings", venue_name: "UPLB Carillon Plaza & the poblacion", barangay: "Batong Malake",
    lat: 14.1640, lng: 121.2400, attendee_count: 4000, hero_image: scene("sunset"),
    starts_at: "2026-12-01T00:00:00+08:00", ends_at: "2026-12-31T23:59:00+08:00",
    organizer: "UPLB OICA · Municipal Government of Los Baños",
    description: "The Makiling Enchanted season finale — lantern installations, a choir festival, and a community countdown closing out the year around the university carillon and the town plaza.",
    schedule: [], updates: [] },

  // ---- Past this year / recurring anchors ----
  { slug: "syensaya", title: "SyenSaya Science Festival", category: "Community", season_key: "sibol", status: "recap",
    date_label: "July 2026", time_label: "Whole day", venue_name: "UPLB & the Los Baños community", barangay: "Batong Malake",
    lat: 14.1660, lng: 121.2430, attendee_count: 8000, hero_image: scene("campus"),
    starts_at: "2026-07-01T00:00:00+08:00", ends_at: "2026-07-31T23:59:00+08:00",
    organizer: "UPLB · Los Baños science community",
    description: "The Special Science and Nature City's flagship festival — interactive exhibits, technology forums, a grand parade, and open houses across the research institutes that anchor the Sibol season.",
    schedule: [], updates: [] },
  { slug: "uplb-feb-fair", title: "UPLB Feb Fair", category: "Community", season_key: "banada", status: "recap",
    date_label: "February 2026", time_label: "Week-long", venue_name: "UPLB Freedom Park", barangay: "Batong Malake",
    lat: 14.1650, lng: 121.2410, attendee_count: 15000, hero_image: scene("market"),
    starts_at: "2026-02-01T00:00:00+08:00", ends_at: "2026-02-07T23:59:00+08:00",
    organizer: "UP Los Baños University Student Council",
    description: "The biggest campus fair of the year — a week of live music, food stalls, org booths, and a festive atmosphere that opens the Bañada season every February.",
    schedule: [], updates: [] },
  { slug: "likha-music-arts-festival", title: "Likha Music & Arts Festival", category: "Arts", season_key: "banada", status: "recap",
    date_label: "February 2026", time_label: "Evening", venue_name: "Los Baños", barangay: "Batong Malake",
    lat: 14.1640, lng: 121.2390, attendee_count: 800, hero_image: scene("heritage"), organizer: "Likha Collective",
    starts_at: "2026-02-14T00:00:00+08:00", ends_at: null,
    description: "Performances by local musicians, dancers, and visual artists celebrating the Los Baños creative community during Bañada season.",
    schedule: [], updates: [] },
  { slug: "los-banos-raid-commemoration", title: "Los Baños Raid Commemoration", category: "Culture", season_key: "banada", status: "recap",
    date_label: "February 23, 2026", time_label: "Morning ceremony", venue_name: "Baker Hall, UPLB", barangay: "Batong Malake",
    lat: 14.1642, lng: 121.2401, attendee_count: 500, hero_image: scene("heritage"),
    starts_at: "2026-02-23T00:00:00+08:00", ends_at: null,
    organizer: "Municipal Government of Los Baños",
    description: "A ceremony every February 23 at Baker Hall commemorating the heroic 1945 raid that rescued over 2,000 Allied prisoners of war interned on the UPLB campus.",
    schedule: [], updates: [] },
  { slug: "mt-makiling-trail-activities", title: "Mt. Makiling Trail Activities", category: "Sports", season_key: "sol-open", status: "season",
    date_label: "El-Biyahe! Sol Open · April", time_label: "Best in the cool dry months", venue_name: "Mt. Makiling Forest Reserve", barangay: "Bagong Silang",
    lat: 14.1350, lng: 121.2000, attendee_count: 0, hero_image: scene("falls"),
    starts_at: "2026-04-01T00:00:00+08:00", ends_at: "2026-04-30T23:59:00+08:00",
    organizer: "Makiling Center for Mountain Ecosystems (UPLB)",
    description: "Hiking, biking, and birdwatching across the 10,000-hectare protected forest reserve — visit Magnetic Hill, Flatrocks, Mudspring, and Aguila Base, or hike to Peak Two for a summit view. The anchor of the Sol Open nature season.",
    schedule: [], updates: [] },
];

// remove any events no longer in the calendar
const keepSlugs = events.map(e => e.slug);
{
  const { data: stale } = await db.from("events").select("id,slug").not("slug", "in", `(${keepSlugs.join(",")})`);
  for (const s of stale ?? []) {
    await db.from("event_schedule_items").delete().eq("event_id", s.id);
    await db.from("event_updates").delete().eq("event_id", s.id);
    await db.from("event_rsvps").delete().eq("event_id", s.id);
    await db.from("events").delete().eq("id", s.id);
    console.log(`  – removed stale event ${s.slug}`);
  }
}

for (const { schedule, updates, ...row } of events) {
  const { data, error } = await db.from("events").upsert(row, { onConflict: "slug" }).select("id").single();
  die(`event ${row.slug}`, error);
  await db.from("event_schedule_items").delete().eq("event_id", data.id);
  await db.from("event_updates").delete().eq("event_id", data.id);
  if (schedule.length) die("schedule", (await db.from("event_schedule_items").insert(schedule.map(s => ({ ...s, event_id: data.id })))).error);
  if (updates.length) die("updates", (await db.from("event_updates").insert(updates.map(u => ({ ...u, event_id: data.id })))).error);
}
console.log(`✓ events (${events.length}) + schedule + updates`);

/* ---------------- tour operators + packages ---------------- */
const operators = [
  { key: "laguna-heritage-coaches", name: "Laguna Heritage Coaches" },
  { key: "elbi-discovery-tours", name: "Laguna Discovery Tours" },
];
const opId = {};
for (const o of operators) {
  let { data } = await db.from("tour_operators").select("id").eq("name", o.name).maybeSingle();
  if (!data) {
    const res = await db.from("tour_operators").insert({ name: o.name }).select("id").single();
    die(`operator ${o.name}`, res.error);
    data = res.data;
  }
  opId[o.key] = data.id;
}

const tours = [
  { slug: "makiling-explorer-tour", operator: "laguna-heritage-coaches", title: "Makiling Explorer Tour", tags: ["Nature", "Culture"],
    duration: "1 Day", price_per_seat: 1499, rating: 4.8, review_count: 32, featured: true, season_key: null,
    origin_pickup_points: ["Manila (Cubao)", "Calamba Crossing"], departure_schedule: "Saturdays, 6:00 AM departure · 6:00 PM return",
    seat_capacity: 40, seats_available: 12, includes: ["Air-conditioned coach", "Licensed tour guide", "Botanic Gardens entrance", "Lunch"],
    hero_image: scene("campus"), reserve_url: "https://example.com/lagunaheritagecoaches/makiling-explorer",
    summary: "A full day across Mt. Makiling's lower slopes — Botanic Gardens, Dampalit Falls, and Tadlac Lake — with a heritage stop in the poblacion.",
    stops: [
      { time_label: "8:00 AM", name: "Makiling Botanic Gardens", blurb: "Guided walk through the UPLB living plant museum." },
      { time_label: "10:30 AM", name: "Dampalit Falls", blurb: "Short trail to the falls; dip stop for those who want one." },
      { time_label: "12:30 PM", name: "Lunch — Los Baños poblacion", blurb: "Set lunch featuring local dishes and buko pie." },
      { time_label: "2:30 PM", name: "Poblacion Heritage Walk", blurb: "The parish, the old bath houses, and heritage homes along the poblacion." },
      { time_label: "4:00 PM", name: "Tadlac Lake View Deck", blurb: "Golden-hour stop before the return trip." },
    ],
    reviews: [
      { author_name: "Marco P.", rating: 5, body: "Great pacing and the guide knew every plant in the gardens. Worth it." },
      { author_name: "Anna R.", rating: 4, body: "Loved the falls. Lunch could be bigger but overall a smooth day." },
    ] },
  { slug: "heritage-science-journey", operator: "elbi-discovery-tours", title: "Heritage & Science Journey", tags: ["Culture", "Science"],
    duration: "1 Day", price_per_seat: 1299, rating: 4.7, review_count: 18, featured: false, season_key: "banada",
    origin_pickup_points: ["Manila (Ortigas)", "Sta. Rosa"], departure_schedule: "Second & fourth Sundays, 6:30 AM departure",
    seat_capacity: 35, seats_available: 20, includes: ["Air-conditioned coach", "Licensed tour guide", "IRRI Riceworld arranged visit", "Merienda"],
    hero_image: scene("heritage"), reserve_url: "https://example.com/lagunadiscoverytours/heritage-science",
    summary: "The town's heritage core paired with its science institutions — the parish and old train station in the morning, IRRI and the Museum of Natural History after lunch.",
    stops: [
      { time_label: "9:00 AM", name: "San Antonio de Padua Parish", blurb: "Start of the heritage core walk." },
      { time_label: "10:00 AM", name: "Old Los Baños Train Station", blurb: "Bambang Station — the town's old rail link to Manila, now a heritage stop." },
      { time_label: "12:00 NN", name: "Lunch — campus town", blurb: "Set lunch near UPLB." },
      { time_label: "1:30 PM", name: "IRRI Riceworld Museum", blurb: "Rice science and culture, arranged visit." },
      { time_label: "3:30 PM", name: "UPLB Museum of Natural History", blurb: "Philippine biodiversity collections." },
    ],
    reviews: [{ author_name: "Grace L.", rating: 5, body: "The IRRI visit alone was worth the trip. Very well organised." }] },
  { slug: "uplb-campus-flavors-tour", operator: "elbi-discovery-tours", title: "UPLB Campus & Flavors Tour", tags: ["Food", "Culture"],
    duration: "Half Day", price_per_seat: 899, rating: 4.6, review_count: 24, featured: false, season_key: null,
    origin_pickup_points: ["Calamba Crossing", "Los Baños Grove"], departure_schedule: "Daily, 1:00 PM departure · 6:00 PM return",
    seat_capacity: 30, seats_available: 8, includes: ["Air-conditioned coach", "Licensed guide", "Food tasting at 3 stops"],
    hero_image: scene("food"), reserve_url: "https://example.com/lagunadiscoverytours/campus-flavors",
    summary: "An afternoon campus loop — Freedom Park, the Carillon, the Fertility Tree — threaded with buko pie, espasol, and a kesong puti tasting.",
    stops: [
      { time_label: "1:30 PM", name: "UPLB Freedom Park & Carillon", blurb: "Campus landmarks and the story behind them." },
      { time_label: "2:30 PM", name: "Buko Pie House", blurb: "Tasting stop — the Los Baños classic." },
      { time_label: "3:30 PM", name: "Baker Hall & Fertility Tree", blurb: "Heritage architecture and campus lore." },
      { time_label: "4:30 PM", name: "Kesong Puti & espasol tasting", blurb: "Local delicacies from nearby makers." },
    ],
    reviews: [
      { author_name: "Jamie T.", rating: 5, body: "Perfect for a half day. So much food." },
      { author_name: "Karl M.", rating: 4, body: "Fun and casual. Wish it was a bit longer." },
    ] },
];

// Coordinates for the itinerary map (keyed by stop name). Kept here so a re-seed,
// which deletes+reinserts stop rows, does not drop the coords.
const STOP_COORDS = {
  "Makiling Botanic Gardens": [14.1440, 121.2430], "Dampalit Falls": [14.1560, 121.2130],
  "Lunch — Los Baños poblacion": [14.1760, 121.2180], "Poblacion Heritage Walk": [14.1772, 121.2170],
  "Tadlac Lake View Deck": [14.1820, 121.2410], "San Antonio de Padua Parish": [14.1772, 121.2170],
  "Old Los Baños Train Station": [14.1870, 121.2240], "Lunch — campus town": [14.1660, 121.2390],
  "IRRI Riceworld Museum": [14.1660, 121.2590], "UPLB Museum of Natural History": [14.1630, 121.2380],
  "UPLB Freedom Park & Carillon": [14.1650, 121.2410], "Buko Pie House": [14.1850, 121.2260],
  "Baker Hall & Fertility Tree": [14.1640, 121.2400], "Kesong Puti & espasol tasting": [14.1700, 121.2300],
};

for (const { operator, stops, reviews, ...row } of tours) {
  const { data, error } = await db.from("tour_packages")
    .upsert({ ...row, operator_id: opId[operator] }, { onConflict: "slug" }).select("id").single();
  die(`tour ${row.slug}`, error);
  await db.from("tour_itinerary_stops").delete().eq("package_id", data.id);
  await db.from("tour_reviews").delete().eq("package_id", data.id);
  die("stops", (await db.from("tour_itinerary_stops").insert(stops.map((s, i) => {
    const c = STOP_COORDS[s.name];
    return { ...s, sort: i + 1, package_id: data.id, lat: c?.[0] ?? null, lng: c?.[1] ?? null };
  }))).error);
  die("reviews", (await db.from("tour_reviews").insert(reviews.map(r => ({ ...r, package_id: data.id })))).error);
}
console.log(`✓ tour operators (${operators.length}) + packages (${tours.length}) + stops + reviews`);

/* ---------------- passport ---------------- */
const passportLocations = [
  { slug: "makiling-botanic-gardens", name: "Makiling Botanic Gardens", category: "Nature", qr_code: "ELBIYAHE-MAKILING", lat: 14.1479, lng: 121.2265 },
  { slug: "los-banos-museum", name: "Old Los Baños Train Station", category: "Culture", qr_code: "ELBIYAHE-MUSEUM", lat: 14.1772, lng: 121.2190 },
  { slug: "buko-pie-house", name: "Buko Pie House", category: "Food", qr_code: "ELBIYAHE-BUKOPIE", lat: 14.1701, lng: 121.2405 },
  { slug: "irri-riceworld", name: "IRRI Riceworld Museum", category: "Science", qr_code: "ELBIYAHE-IRRI", lat: 14.1667, lng: 121.2570 },
];
die("passport_locations", (await db.from("passport_locations").upsert(passportLocations, { onConflict: "slug" })).error);

await db.from("reward_redemptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await db.from("passport_rewards").delete().neq("id", "00000000-0000-0000-0000-000000000000");
const rewards = [
  { title: "10% Off Local Partner Voucher", description: "Redeemable at participating El-Biyahe! partners.", tier: "Explorer", required_stamps: 5, active: true },
  { title: "Free buko pie slice — Buko Pie House", description: "Redeem in-store · expires Mar 31", tier: "Explorer", required_stamps: 3, active: true },
];
die("passport_rewards", (await db.from("passport_rewards").insert(rewards)).error);
console.log(`✓ passport locations (${passportLocations.length}) + rewards (${rewards.length})`);

/* ---------------- ride guide ---------------- */
await db.from("ride_routes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await db.from("ride_tips").delete().neq("id", "00000000-0000-0000-0000-000000000000");
const rideRoutes = [
  { kind: "jeep", label: "UPLB ↔ Los Baños Town Proper", mode: "Jeepney", fare_text: "₱13 est.", frequency_text: "every 5–10 min", note: "Main line along the National Highway. Say 'para' one landmark before your stop.", sort: 1 },
  { kind: "jeep", label: "UPLB ↔ Bay", mode: "Jeepney", fare_text: "₱15 est.", frequency_text: "every 10–15 min", note: "Board at the Grove terminal. Pass fare forward — 'bayad po'.", sort: 2 },
  { kind: "jeep", label: "UPLB ↔ Calauan", mode: "Jeepney", fare_text: "₱20 est.", frequency_text: "every 15 min", note: "Long-haul line; sit toward the front for an easier exit.", sort: 3 },
  { kind: "jeep", label: "Crossing ↔ Grove", mode: "Jeepney", fare_text: "₱12 est.", frequency_text: "every 5 min", note: "Short hop that covers most of the campus-town strip.", sort: 4 },
  { kind: "tricycle_zone", label: "Zone 1 — Batong Malake / Grove", fare_text: "₱30 special · ₱12 sharing", note: "Covers the Grove dining strip and Umali Subdivision.", sort: 1 },
  { kind: "tricycle_zone", label: "Zone 2 — Poblacion / Bayog", fare_text: "₱35 special", note: "Town hall, public market, and the parish.", sort: 2 },
  { kind: "tricycle_zone", label: "Zone 3 — Anos / Mayondon", fare_text: "₱40 special", note: "Toward the lakeshore barangays; agree on fare before boarding.", sort: 3 },
];
die("ride_routes", (await db.from("ride_routes").insert(rideRoutes)).error);
const rideTips = [
  "Jeepney stops aren't marked — flag one down anywhere it's safe to pull over, and knock on the roof or say 'para' to get off.",
  "Have coins ready. Hand your fare forward and say 'bayad po'; the driver passes change back the same way.",
  "Tricycles are door-to-door within a zone. Confirm 'special' (private) vs 'sharing' and the fare before you sit down.",
  "After dark on Mt. Makiling routes, arrange a return ride in advance — service thins out past 8 PM.",
].map((body, i) => ({ body, sort: i + 1 }));
die("ride_tips", (await db.from("ride_tips").insert(rideTips)).error);
console.log(`✓ ride routes (${rideRoutes.length}) + tips (${rideTips.length})`);

/* ---------------- admin bootstrap ---------------- */
const adminEmail = "neilmedallon1@gmail.com";
const { data: list } = await db.auth.admin.listUsers();
const admin = list?.users?.find(u => u.email === adminEmail);
if (admin) {
  die("admin role", (await db.from("profiles").update({ role: "admin" }).eq("id", admin.id)).error);
  console.log(`✓ ${adminEmail} promoted to admin`);
} else {
  console.log(`• ${adminEmail} has not signed up yet — re-run seed after first sign-in, or set role='admin' in the dashboard.`);
}

console.log("\nSeed complete.");
