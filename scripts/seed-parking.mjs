/* Narrow seed for additional Los Baños parking spots — adds real researched rows to
   parking_spots without touching the 3 existing ones or any other table.
   Sourced from an OSM/Mapcarta aggregation pass, not the LGU — all rows are tagged
   verified:'community_reported'. No numeric fees/capacities are invented: fields the
   source didn't state a number for are left null, same discipline as the existing rows.
   Run: node --env-file=.env.local scripts/seed-parking.mjs */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY (use --env-file=.env.local)");
const db = createClient(url, key, { auth: { persistSession: false } });

const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message); process.exit(1); } };

const rows = [
  { slug: "centtro-mall-parking", name: "Los Baños Centtro Mall Parking Lot", place: "Los Baños Centtro Mall", barangay: "Batong Malake", lat: 14.17067, lng: 121.24425, kind: "free", hours_label: "Mall operating hours", category: "mall", access_type: "Customers / visitors", notes: "Mall parking on Lopez Avenue for the SaveMore/Bonchon/Potato Corner commercial strip." },
  { slug: "robinsons-town-mall-parking", name: "Robinsons Town Mall Los Baños Parking", place: "Robinsons Town Mall", barangay: "Batong Malake", lat: 14.17721, lng: 121.24209, kind: "free", hours_label: "Mall operating hours", category: "mall", access_type: "Customers / visitors", notes: "Mall parking on Lopez Avenue, Batong Malake." },
  { slug: "olivarez-plaza-parking", name: "Olivarez Plaza Mall Parking Area", place: "Olivarez Plaza Mall", barangay: "Anos", lat: 14.17972, lng: 121.23822, kind: "free", hours_label: "Mall operating hours", category: "mall", access_type: "Customers / visitors", notes: "Along the National Highway; the parking area is indexed separately from the mall itself." },
  { slug: "south-supermarket-parking", name: "South Supermarket Parking Area", place: "South Supermarket", barangay: "Maahas", lat: 14.17697, lng: 121.26233, kind: "free", category: "supermarket", access_type: "Customers / visitors", notes: "Site coordinate for South Supermarket — not a surveyed parking-bay centroid." },
  { slug: "biosci-parking", name: "BioSci Parking Lot", place: "UPLB — Institute of Biological Sciences", barangay: "UPLB", lat: 14.16552, lng: 121.24069, kind: "free", category: "institutional", access_type: "Public access", notes: "Surface parking beside the Biological Sciences complex." },
  { slug: "devcom-parking", name: "DevCom Parking Lot", place: "UPLB — College of Development Communication", barangay: "UPLB", lat: 14.16655, lng: 121.24241, kind: "free", category: "institutional", access_type: "Public access", notes: "Surface parking associated with UPLB DevCom." },
  { slug: "baker-hall-parking", name: "Baker Hall Parking Area", place: "UPLB — Baker Hall", barangay: "UPLB", lat: 14.16153, lng: 121.24252, kind: "free", category: "institutional", access_type: "Public access" },
  { slug: "su-parking", name: "SU Parking Lot", place: "UPLB — Student Union area", barangay: "UPLB", lat: 14.16215, lng: 121.24194, kind: "free", category: "institutional", access_type: "Public access" },
  { slug: "math-building-parking", name: "Mathematics Building Parking Lot", place: "UPLB — Mathematics Building", barangay: "UPLB", lat: 14.16466, lng: 121.24459, kind: "free", category: "institutional", access_type: "Public access" },
  { slug: "physci-1-parking", name: "Physci Parking 1", place: "UPLB — Physical Sciences Building", barangay: "UPLB", lat: 14.16485, lng: 121.24247, kind: "free", category: "institutional", access_type: "Public access" },
  { slug: "cem-faculty-parking", name: "CEM Faculty Parking Lot", place: "UPLB — College of Engineering and Agro-Industrial Technology", barangay: "UPLB", lat: 14.1674, lng: 121.2420, kind: "free", category: "institutional", access_type: "Private / restricted — permission required", notes: "Faculty parking, not open to general campus visitors." },
  { slug: "housing-land-grant-parking", name: "Housing & Land Grant Offices Parking", place: "UPLB — Housing & Land Grant Management Offices", barangay: "UPLB", lat: 14.1669, lng: 121.2421, kind: "free", category: "institutional", access_type: "Private / restricted", notes: "Parking for the administrative offices, not general public parking." },
  { slug: "88-hotspring-resort-parking", name: "88 Hotspring Resort Parking", place: "88 Hotspring Resort", barangay: "Tadlac", lat: 14.17169, lng: 121.20096, kind: "free", category: "resort", access_type: "Guests / visitors", notes: "On the Tadlac resort corridor, west of the main UPLB/Batong Malake cluster." },
  { slug: "centtro-residences-parking", name: "Centtro Residences Parking", place: "Centtro Residences", barangay: "Batong Malake", lat: 14.1736, lng: 121.2433, kind: "free", hours_label: "24 hours (hotel guests)", category: "hotel", access_type: "Guests", notes: "Free parking listed as a hotel amenity; attached to the Centtro Mall site." },
  { slug: "batong-malake-market-parking", name: "Pamilihang Bayan ng Batong Malake Parking", place: "Batong Malake Public Market", barangay: "Batong Malake", lat: 14.178, lng: 121.240, kind: "paid", category: "market", access_type: "Public / market", notes: "Market-associated parking; fee not listed on the source." },
];

die("parking_spots", (await db.from("parking_spots").upsert(rows, { onConflict: "slug" })).error);
console.log(`✓ parking spots (${rows.length})`);
