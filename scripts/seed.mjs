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

/* ---------------- seasons ---------------- */
const seasons = [
  { key: "banada", quarter: "Q1", name: "El-Biyahe! Bañada", months: "February", pillars: "Art · Heritage · Culture", is_current: true, sort: 1 },
  { key: "sol-open", quarter: "Q2", name: "Sol Open", months: "April", pillars: "Nature · Sport · Wellness", is_current: false, sort: 2 },
  { key: "sibol", quarter: "Q3", name: "Sibol Weekend Market", months: "July", pillars: "Ideas · Innovation · Enterprise", is_current: false, sort: 3 },
  { key: "makiling-enchanted", quarter: "Q4", name: "Makiling Enchanted", months: "December", pillars: "Community · Tradition · Celebration", is_current: false, sort: 4 },
];
die("seasons", (await db.from("seasons").upsert(seasons, { onConflict: "key" })).error);
console.log(`✓ seasons (${seasons.length})`);

/* ---------------- events ---------------- */
const events = [
  { slug: "uplb-feb-fair-2025", title: "UPLB Feb Fair 2025", category: "Community", season_key: "banada", status: "live",
    date_label: "Feb 15, 2026", time_label: "5:00 PM", venue_name: "UPLB Freedom Park", barangay: "Batong Malake",
    lat: 14.165, lng: 121.241, attendee_count: 1284, hero_image: scene("market"),
    organizer: "UP Los Baños University Student Council",
    description: "The biggest campus-wide fair of the year — concert nights, org booths, food stalls, and a fireworks finale across a week of programming at Freedom Park.",
    schedule: [
      { time_label: "5:00 PM", item: "Opening Program", state: "done", sort: 1 },
      { time_label: "6:00 PM", item: "Student Performances", state: "live", sort: 2 },
      { time_label: "7:30 PM", item: "Band Performance", state: "next", sort: 3 },
      { time_label: "9:00 PM", item: "Fireworks Show", state: "next", sort: 4 },
    ],
    updates: [{ ago_label: "10 mins ago", body: "Program update: Fireworks moved to 9:00 PM due to weather." }] },
  { slug: "likha-music-arts-festival", title: "Likha Music & Arts Festival", category: "Arts", season_key: "banada", status: "today",
    date_label: "Feb 14, 2026", time_label: "7:00 PM", venue_name: "Baker Hall, UPLB", barangay: "Batong Malake",
    lat: 14.164, lng: 121.239, attendee_count: 430, hero_image: scene("heritage"), organizer: "Likha Collective",
    description: "An evening of local bands, spoken word, and a pop-up art market celebrating Los Baños creatives during Bañada season.",
    schedule: [
      { time_label: "7:00 PM", item: "Art market opens", sort: 1 },
      { time_label: "8:00 PM", item: "Live sets begin", sort: 2 },
      { time_label: "10:30 PM", item: "Closing jam", sort: 3 },
    ], updates: [] },
  { slug: "art-in-the-park-popup", title: "Art in the Park Pop-up Market", category: "Arts", season_key: "banada", status: "today",
    date_label: "Feb 15, 2026", time_label: "9:00 AM", venue_name: "Old Pantalan, Los Baños", barangay: "Bayog",
    lat: 14.178, lng: 121.243, attendee_count: 210, hero_image: scene("lake"), organizer: "Los Baños Tourism Office",
    description: "A morning lakeside market with handmade crafts, prints, and merienda from Los Baños makers.",
    schedule: [{ time_label: "9:00 AM", item: "Stalls open", sort: 1 }, { time_label: "12:00 NN", item: "Market closes", sort: 2 }], updates: [] },
  { slug: "makiling-trail-run", title: "Makiling Trail Run", category: "Sports", season_key: "sol-open", status: "season",
    date_label: "Apr 12, 2026", time_label: "5:30 AM", venue_name: "UPLB College of Forestry", barangay: "Bagong Silang",
    lat: 14.148, lng: 121.239, attendee_count: 540, hero_image: scene("campus"), organizer: "El-Biyahe! Runners Club",
    description: "A 10K and 21K trail race on the lower slopes of Mt. Makiling, opening the Sol Open nature season.",
    schedule: [{ time_label: "5:30 AM", item: "21K gun start", sort: 1 }, { time_label: "6:00 AM", item: "10K gun start", sort: 2 }, { time_label: "9:00 AM", item: "Awarding", sort: 3 }], updates: [] },
  { slug: "bay-heritage-walk", title: "Los Baños Heritage Walk", category: "Culture", season_key: "banada", status: "season",
    date_label: "Feb 22, 2026", time_label: "8:00 AM", venue_name: "Meet at San Antonio de Padua Parish", barangay: "Poblacion",
    lat: 14.177, lng: 121.219, attendee_count: 96, hero_image: scene("heritage"), organizer: "Los Baños Museum",
    description: "A guided two-hour walk through the town's heritage core — the parish, the old bath houses, and heritage homes along the poblacion.",
    schedule: [{ time_label: "8:00 AM", item: "Assembly & briefing", sort: 1 }, { time_label: "8:15 AM", item: "Walk begins", sort: 2 }, { time_label: "10:15 AM", item: "Wrap-up at the museum", sort: 3 }], updates: [] },
  { slug: "sibol-weekend-market", title: "Sibol Weekend Market", category: "Community", season_key: "sibol", status: "season",
    date_label: "Jul 5, 2026", time_label: "4:00 PM", venue_name: "Ruby St., Umali Subdivision", barangay: "Batong Malake",
    lat: 14.170, lng: 121.240, attendee_count: 320, hero_image: scene("market"), organizer: "El-Biyahe! Community Market",
    description: "The recurring weekend market of makers, growers, and student startups that anchors the Sibol enterprise season.",
    schedule: [{ time_label: "4:00 PM", item: "Market opens", sort: 1 }, { time_label: "10:00 PM", item: "Market closes", sort: 2 }], updates: [] },
  { slug: "makiling-enchanted-lantern", title: "Makiling Enchanted Lantern Nights", category: "Community", season_key: "makiling-enchanted", status: "season",
    date_label: "Dec 12, 2026", time_label: "6:00 PM", venue_name: "UPLB Carillon Plaza", barangay: "Batong Malake",
    lat: 14.164, lng: 121.240, attendee_count: 780, hero_image: scene("sunset"), organizer: "UPLB Office for Initiatives in Culture and the Arts",
    description: "Lantern installations, a choir festival, and a community countdown opening the Makiling Enchanted holiday season.",
    schedule: [{ time_label: "6:00 PM", item: "Lantern lighting", sort: 1 }, { time_label: "7:00 PM", item: "Choir festival", sort: 2 }, { time_label: "9:00 PM", item: "Community countdown", sort: 3 }], updates: [] },
  { slug: "uplb-feb-fair-2024-recap", title: "UPLB Feb Fair 2024 — Recap", category: "Community", season_key: "banada", status: "recap",
    date_label: "Feb 2024", time_label: "—", venue_name: "UPLB Freedom Park", barangay: "Batong Malake",
    lat: 14.165, lng: 121.241, attendee_count: 1284, hero_image: scene("market"), organizer: "UP Los Baños University Student Council",
    description: "Last year's fair drew record crowds across three days — 42 vendors, 18 activities, and a sold-out concert night.",
    schedule: [], updates: [] },
];

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
  { key: "elbi-discovery-tours", name: "El-Biyahe! Discovery Tours" },
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
      { time_label: "2:30 PM", name: "Los Baños Museum & Heritage Walk", blurb: "The parish, old bath houses, and heritage homes." },
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
    hero_image: scene("heritage"), reserve_url: "https://example.com/elbiyahediscovery/heritage-science",
    summary: "The town's heritage core paired with its science institutions — the parish and museum in the morning, IRRI and the Museum of Natural History after lunch.",
    stops: [
      { time_label: "9:00 AM", name: "San Antonio de Padua Parish", blurb: "Start of the heritage core walk." },
      { time_label: "10:00 AM", name: "Los Baños Museum", blurb: "Local history from the hot-spring town's origins." },
      { time_label: "12:00 NN", name: "Lunch — campus town", blurb: "Set lunch near UPLB." },
      { time_label: "1:30 PM", name: "IRRI Riceworld Museum", blurb: "Rice science and culture, arranged visit." },
      { time_label: "3:30 PM", name: "UPLB Museum of Natural History", blurb: "Philippine biodiversity collections." },
    ],
    reviews: [{ author_name: "Grace L.", rating: 5, body: "The IRRI visit alone was worth the trip. Very well organised." }] },
  { slug: "uplb-campus-flavors-tour", operator: "elbi-discovery-tours", title: "UPLB Campus & Flavors Tour", tags: ["Food", "Culture"],
    duration: "Half Day", price_per_seat: 899, rating: 4.6, review_count: 24, featured: false, season_key: null,
    origin_pickup_points: ["Calamba Crossing", "Los Baños Grove"], departure_schedule: "Daily, 1:00 PM departure · 6:00 PM return",
    seat_capacity: 30, seats_available: 8, includes: ["Air-conditioned coach", "Licensed guide", "Food tasting at 3 stops"],
    hero_image: scene("food"), reserve_url: "https://example.com/elbiyahediscovery/campus-flavors",
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

for (const { operator, stops, reviews, ...row } of tours) {
  const { data, error } = await db.from("tour_packages")
    .upsert({ ...row, operator_id: opId[operator] }, { onConflict: "slug" }).select("id").single();
  die(`tour ${row.slug}`, error);
  await db.from("tour_itinerary_stops").delete().eq("package_id", data.id);
  await db.from("tour_reviews").delete().eq("package_id", data.id);
  die("stops", (await db.from("tour_itinerary_stops").insert(stops.map((s, i) => ({ ...s, sort: i + 1, package_id: data.id })))).error);
  die("reviews", (await db.from("tour_reviews").insert(reviews.map(r => ({ ...r, package_id: data.id })))).error);
}
console.log(`✓ tour operators (${operators.length}) + packages (${tours.length}) + stops + reviews`);

/* ---------------- passport ---------------- */
const passportLocations = [
  { slug: "makiling-botanic-gardens", name: "Makiling Botanic Gardens", category: "Nature", qr_code: "ELBIYAHE-MAKILING", lat: 14.1479, lng: 121.2265 },
  { slug: "los-banos-museum", name: "Los Baños Museum", category: "Culture", qr_code: "ELBIYAHE-MUSEUM", lat: 14.1772, lng: 121.2190 },
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
