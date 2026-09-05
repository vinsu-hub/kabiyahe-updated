/* Narrow re-seed for the Ride Guide only — updates ride_routes/ride_tips to the
   community-reported commuter data without touching any other launch content.
   Run: node --env-file=.env.local scripts/reseed-ride-guide.mjs */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY (use --env-file=.env.local)");
const db = createClient(url, key, { auth: { persistSession: false } });

const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message); process.exit(1); } };

await db.from("ride_routes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await db.from("ride_tips").delete().neq("id", "00000000-0000-0000-0000-000000000000");

/* Sourced from a Los Baños commuter research pass (UPLB commuting discussions + the
   LB tricycle fare ordinance). Fares/frequencies are community-reported, not an
   official current fare matrix — labeled as such rather than stated as fact. */
const rideRoutes = [
  { kind: "jeep", label: "UPLB ↔ Bayan / Olivarez", mode: "Jeepney", fare_text: "₱11 (community-reported)", frequency_text: "frequent, main corridor", note: "Check the signboard, then ask \"Olivarez po?\" or \"Bayan po?\" before boarding.", sort: 1, image: "/scenes/elbiyahe-bus.svg", stops: ["UPLB", "Bayan", "Olivarez"], travel_time_text: "15–20 min (est.)" },
  { kind: "jeep", label: "UPLB ↔ Robinson", mode: "Jeepney", fare_text: "₱11 (community-reported)", frequency_text: "frequent", note: "Same UPLB–town corridor as the Olivarez/Bayan line — confirm the destination on the signboard.", sort: 2, image: "/scenes/elbiyahe-bus.svg", stops: ["UPLB", "Bayan", "Robinson"], travel_time_text: "15–20 min (est.)" },
  { kind: "jeep", label: "UPLB ↔ Calamba / Crossing", mode: "Jeepney", fare_text: "₱25–30 (community-reported)", frequency_text: "frequent", note: "For Sta. Rosa or Enchanted Kingdom, get off at Crossing Calamba and transfer toward Balibago Complex.", sort: 3, image: "/scenes/elbiyahe-bus.svg", stops: ["UPLB", "Bayan", "Crossing Calamba"], travel_time_text: "25–35 min (est.)" },
  { kind: "tricycle_zone", label: "Zone 1 — Batong Malake / Grove", fare_text: "₱14 first km ordinance rate + ₱1/km beyond", note: "Covers the Grove dining strip and Umali Subdivision. Special (private) trips are agreed on before boarding.", sort: 1 },
  { kind: "tricycle_zone", label: "Zone 2 — Poblacion / Bayog", fare_text: "₱14 first km ordinance rate + ₱1/km beyond", note: "Town hall, public market, and the parish.", sort: 2 },
  { kind: "tricycle_zone", label: "Zone 3 — Anos / Mayondon", fare_text: "₱14 first km ordinance rate + ₱1/km beyond", note: "Toward the lakeshore barangays; agree on the fare before boarding for a special trip.", sort: 3 },
];
die("ride_routes", (await db.from("ride_routes").insert(rideRoutes)).error);

const rideTips = [
  "Jeepney stops aren't marked — flag one down anywhere it's safe to pull over, and say \"para po\" (or knock on the roof rail) to get off.",
  "Have coins ready. Pass your fare forward and say \"bayad po\"; the driver passes change back the same way.",
  "For tricycles, ask \"magkano po?\" first. A regular shared route has a known fare; a special (private) trip is agreed on before you leave.",
  "Fares and frequencies above are community-reported, not an official current fare matrix — confirm with the driver before boarding.",
  "After dark, service thins out — confirm the route before boarding and prefer established terminals and visible public areas.",
].map((body, i) => ({ body, sort: i + 1 }));
die("ride_tips", (await db.from("ride_tips").insert(rideTips)).error);

console.log(`✓ ride routes (${rideRoutes.length}) + tips (${rideTips.length})`);
