/* The 17-site Los Baños Heritage Walk — verbatim from the Municipality's
   "Discover Los Baños" tourism guide (p.3–5). Idempotent (delete + reinsert).
   Run: node --env-file=.env.local scripts/seed-heritage-walk.mjs */
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const stops = [
  // Colonial & Foundational Sites
  { sort: 1, era_group: "Colonial & Foundational Sites", name: "Immaculate Conception Parish", lat: 14.1772, lng: 121.2170, is_passport_spot: true,
    blurb: "Established in 1613; where \"Mainit\" was officially renamed \"Los Baños\" in 1615. Built beside the hospital so the sick could seek refuge and pay homage to Our Lady while bathing in the mystical hot springs." },
  { sort: 2, era_group: "Colonial & Foundational Sites", name: "Ruins of Agua Santa Resort", lat: 14.1767, lng: 121.2159, is_passport_spot: false,
    blurb: "A \"summer palace\" (Casa Estancia del Gobernador) and the oldest hospital built by the Franciscans in the 1590s, following the discovery of the miraculous hot spring by San Pedro Bautista." },
  { sort: 3, era_group: "Colonial & Foundational Sites", name: "Statue of Padre Pedro Bautista", lat: 14.1770, lng: 121.2164, is_passport_spot: false,
    blurb: "Honors the man who discovered the hot springs in the 1590s, leading to the founding of Los Baños as a healing town." },
  { sort: 4, era_group: "Colonial & Foundational Sites", name: "UPLB Foundation Site", lat: 14.1651, lng: 121.2415, is_passport_spot: true,
    blurb: "On March 6, 1909, the College of Agriculture was founded here, marking the start of Los Baños as a premier center for agricultural science. A National Historical Institute marker stands here." },

  // Government & Civic Heritage
  { sort: 5, era_group: "Government & Civic Heritage", name: "New Los Baños Municipal Hall", lat: 14.1812, lng: 121.2232, is_passport_spot: false,
    blurb: "Opened in 2010 in Barangay Timugan; a modern, efficient hub for public service." },
  { sort: 6, era_group: "Government & Civic Heritage", name: "Ruins of the First Los Baños Municipal Hall", lat: 14.1761, lng: 121.2156, is_passport_spot: false,
    blurb: "On Villegas Street; a reminder of the town's earliest attempts at self-governance." },
  { sort: 7, era_group: "Government & Civic Heritage", name: "Old Municipal Hall", lat: 14.1758, lng: 121.2161, is_passport_spot: false,
    blurb: "Once the center of local governance; still serves the community today." },
  { sort: 8, era_group: "Government & Civic Heritage", name: "Old Houses along Villegas Street", lat: 14.1763, lng: 121.2158, is_passport_spot: false,
    blurb: "Living testaments to the architectural and social heritage of past generations." },

  // Transportation & Commerce
  { sort: 9, era_group: "Transportation & Commerce", name: "Old Los Baños Train Station (Bambang Station)", lat: 14.1870, lng: 121.2240, is_passport_spot: true,
    blurb: "Now called Bambang Station; once a vital hub connecting Los Baños to Manila and other provinces." },
  { sort: 10, era_group: "Transportation & Commerce", name: "Poblacion Public Market", lat: 14.1758, lng: 121.2162, is_passport_spot: true,
    blurb: "Established in 1921; a central hub for commerce and community life for over a century." },

  // Revolutionary & Wartime History
  { sort: 11, era_group: "Revolutionary & Wartime History", name: "Gen. Paciano Rizal Shrine", lat: 14.1748, lng: 121.2138, is_passport_spot: false,
    blurb: "Home of Paciano Rizal, general in the revolution and older brother of Dr. Jose P. Rizal. Honors a quiet hero in the fight for independence against Spanish and American colonizers." },
  { sort: 12, era_group: "Revolutionary & Wartime History", name: "Baker Hall", lat: 14.1642, lng: 121.2401, is_passport_spot: false,
    blurb: "A significant historical site that served as a US Army hospital and WWII internment camp; now part of the UPLB campus." },
  { sort: 13, era_group: "Revolutionary & Wartime History", name: "Gen. Yamashita / Gen. Homma Shrine", lat: 14.1560, lng: 121.2360, is_passport_spot: false,
    blurb: "A memorial to Filipino, American, and Japanese soldiers who fought in World War II." },
  { sort: 14, era_group: "Revolutionary & Wartime History", name: "Los Baños Raid Commemoration Site", lat: 14.1648, lng: 121.2410, is_passport_spot: false,
    blurb: "Every February 23, a ceremony at Baker Hall commemorates the heroic 1945 rescue of over 2,000 Allied prisoners of war." },

  // Other Heritage Sites
  { sort: 15, era_group: "Other Heritage Sites", name: "Old Pantalan", lat: 14.1793, lng: 121.2430, is_passport_spot: false,
    blurb: "Once a bustling port on Laguna de Bay connecting Los Baños to other towns and the Pasig River. Today it hosts the weekend \"Sunset at the Park\"." },
  { sort: 16, era_group: "Other Heritage Sites", name: "Los Baños Museum", lat: 14.1765, lng: 121.2165, is_passport_spot: false,
    blurb: "Immerses visitors in the town's journey from Spanish spa town to vibrant modern community." },
  { sort: 17, era_group: "Other Heritage Sites", name: "Caesar Perez Memorial Therapeutic Massage Center & Health Spa", lat: 14.1761, lng: 121.2182, is_passport_spot: false,
    blurb: "Concludes the Heritage Walk; home to the famous hot springs linking the town's healing history with modern tourism." },
];

await db.from("heritage_walk_stops").delete().neq("id", "00000000-0000-0000-0000-000000000000");
const { error } = await db.from("heritage_walk_stops").insert(stops);
if (error) { console.error("✗", error.message); process.exit(1); }
console.log(`✓ heritage_walk_stops (${stops.length})`);
