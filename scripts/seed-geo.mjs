/* Backfill real coordinates for the map surfaces. Idempotent — safe to re-run.
   Coords are town/landmark-level approximations (good to ~100-300 m), sourced
   from OSM / Wikimedia / known values. Run:
     node --env-file=.env.local scripts/seed-geo.mjs */
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const DESTINATIONS = {
  "al-fresco-springs": [14.1810, 121.2400],
  "bato-resort": [14.2331, 121.3620],
  "caliraya-lake": [14.2820, 121.4700],
  "dampalit-falls": [14.1560, 121.2130],
  "danielitos-home-kitchen": [14.1680, 121.2400],
  "diocesan-shrine-of-st-therese-of-the-child-jesus": [14.1630, 121.2350],
  "diwata-nature-resort": [14.0730, 121.3250],
  "enchanted-kingdom": [14.3116, 121.0997],
  "flat-rocks": [14.1380, 121.1940],
  "irri-riceworld-museum": [14.1660, 121.2590],
  "laresio-lakeside-resort-spa": [14.1800, 121.2370],
  "los-ba-os-hot-springs": [14.1760, 121.2180],
  "los-ba-os-municipal-hall-history": [14.1812, 121.2232],
  "los-ba-os-public-market": [14.1758, 121.2162],
  "majayjay-church": [14.1462, 121.4720],
  "makiling-botanic-gardens": [14.1440, 121.2430],
  "makiling-mud-spring": [14.1350, 121.2020],
  "malayas-cafe": [14.1660, 121.2410],
  "mount-makiling": [14.1290, 121.1940],
  "nuvali-lakeside": [14.2400, 121.0620],
  "olivarez-plaza": [14.1700, 121.2430],
  "paete-woodcarving-heritage": [14.3650, 121.4830],
  "pagsanjan-falls": [14.2306, 121.5525],
  "philippine-carabao-center-at-uplb": [14.1610, 121.2530],
  "rizal-shrine": [14.2118, 121.1653],
  "san-antonio-de-padua-parish": [14.1772, 121.2170],
  "seda-nuvali": [14.2380, 121.0650],
  "seven-crater-lakes": [14.0700, 121.3250],
  "sining-makiling-gallery": [14.1650, 121.2400],
  "sol-y-viento-hotels-and-resorts": [14.1630, 121.1960],
  "splash-mountain-resort": [14.1560, 121.2160],
  "uplb-fertility-tree": [14.1640, 121.2400],
  "uplb-museum-of-natural-history": [14.1630, 121.2380],
};

const DELICACIES = {
  "buko-pie-original": [14.1850, 121.2260],
  "mer-nels-cake": [14.1740, 121.2290],
  "dtri-dairy-products": [14.1660, 121.2430],
  "los-banos-public-market-stalls": [14.1758, 121.2162],
};

const ACCOMMODATIONS = {
  "trace-suites": [14.1700, 121.2370],
  "city-of-springs": [14.1580, 121.2110],
  "anest-tower": [14.1660, 121.2350],
};

const PARKING = {
  "municipal-hall-parking": [14.1812, 121.2232],
  "public-market-parking": [14.1758, 121.2162],
  "uplb-main-gate-area": [14.1650, 121.2410],
};

const TOUR_STOPS = {
  "Makiling Botanic Gardens": [14.1440, 121.2430],
  "Dampalit Falls": [14.1560, 121.2130],
  "Lunch — Los Baños poblacion": [14.1760, 121.2180],
  "Poblacion Heritage Walk": [14.1772, 121.2170],
  "Tadlac Lake View Deck": [14.1820, 121.2410],
  "San Antonio de Padua Parish": [14.1772, 121.2170],
  "Old Los Baños Train Station": [14.1870, 121.2240],
  "Lunch — campus town": [14.1660, 121.2390],
  "IRRI Riceworld Museum": [14.1660, 121.2590],
  "UPLB Museum of Natural History": [14.1630, 121.2380],
  "UPLB Freedom Park & Carillon": [14.1650, 121.2410],
  "Buko Pie House": [14.1850, 121.2260],
  "Baker Hall & Fertility Tree": [14.1640, 121.2400],
  "Kesong Puti & espasol tasting": [14.1700, 121.2300],
};

async function apply(table, key, map) {
  let n = 0;
  for (const [id, [lat, lng]] of Object.entries(map)) {
    const { error } = await db.from(table).update({ lat, lng }).eq(key, id);
    if (error) { console.error(`✗ ${table} ${id}: ${error.message}`); continue; }
    n++;
  }
  console.log(`✓ ${table}: ${n}/${Object.keys(map).length}`);
}

await apply("destinations", "slug", DESTINATIONS);
await apply("delicacies", "slug", DELICACIES);
await apply("accommodations", "slug", ACCOMMODATIONS);
await apply("parking_spots", "slug", PARKING);
await apply("tour_itinerary_stops", "name", TOUR_STOPS);

// coverage report
for (const t of ["destinations", "delicacies", "accommodations", "parking_spots", "tour_itinerary_stops", "events", "passport_locations"]) {
  const { data } = await db.from(t).select("lat,lng");
  const ok = data.filter(r => r.lat != null && r.lng != null).length;
  console.log(`  ${t.padEnd(22)} ${ok}/${data.length}`);
}
