/* Real Los Baños food & drink spots. The original 4 come from the Municipality's
   brochure transcript; the rest are real, verifiable establishments found via
   web search (see source_url on each) to responsibly cover more categories —
   no invented names, ratings, or review counts. Categories with no verified
   vendor (Street Food) are simply left empty rather than padded.
   Idempotent (delete + reinsert). Run: node --env-file=.env.local scripts/seed-delicacies.mjs */
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const scene = () => "/scenes/elbiyahe-food.svg";

const items = [
  // ---- Local Favorites (pasalubong) ----
  { slug: "letys-buko-pie", name: "Lety's Buko Pie", category: "Local Favorites",
    place: "National Highway, Km 61–64 stretch, Los Baños", barangay: "Bambang",
    lat: 14.1852, lng: 121.2258, price_tier: 2, featured: true,
    tags: ["Pasalubong", "Baked", "Classic"], dietary_tags: [],
    description: "Family-run since 1976 — one of the original names along the Los Baños buko pie stretch, made from young coconut in a sweet custard filling.",
    source_url: "https://nextonyourlist.com/only-here-a-los-banos-food-trip-guide-like-this/" },
  { slug: "mer-nels-cake", name: "Mer-Nel's Cake House", category: "Local Favorites",
    place: "Los Baños, Laguna", barangay: "Poblacion",
    lat: 14.174, lng: 121.229, price_tier: 2, featured: true,
    tags: ["Bakery", "Local Favorite"], dietary_tags: [],
    description: "A Los Baños institution, famous for its moist and decadent chocolate cake — the go-to for locals celebrating any special occasion.",
    source_url: "https://nextonyourlist.com/only-here-a-los-banos-food-trip-guide-like-this/" },
  { slug: "dtri-dairy-products", name: "DTRI Dairy Products", category: "Local Favorites",
    place: "Dairy Training and Research Institute, UPLB Campus", barangay: "Batong Malake",
    lat: 14.166, lng: 121.243, price_tier: 2, featured: true,
    tags: ["UPLB", "Dairy", "Pasalubong"], dietary_tags: [],
    description: "Fresh milk, yogurt, and artisanal cheese made on the institute's own farm — a uniquely Los Baños souvenir.",
    source_url: null },

  // ---- Market Finds ----
  { slug: "los-banos-public-market-stalls", name: "Los Baños Public Market Food Stalls", category: "Market Finds",
    place: "Los Baños Public Market (est. 1921)", barangay: "Poblacion",
    lat: 14.1758, lng: 121.2162, price_tier: 1, featured: false,
    tags: ["Market", "Everyday Eats"], dietary_tags: [],
    description: "Everyday eats from the stalls of the century-old public market at the heart of the poblacion.",
    source_url: null },

  // ---- Cafes & Desserts ----
  { slug: "irri-riceworld-coffee-shop", name: "IRRI Riceworld Coffee Shop and Bookstore", category: "Cafes & Desserts",
    place: "Riceworld Museum, IRRI Headquarters", barangay: "Batong Malake",
    lat: 14.1730, lng: 121.2580, price_tier: 2, featured: false,
    tags: ["Café", "Museum"], dietary_tags: [],
    description: "A coffee shop and bookstore inside the International Rice Research Institute's Riceworld museum complex.",
    source_url: "https://www.spot.ph/eatdrink/the-latest-eat-drink/spot-out-of-town-where-to-eat-in-los-banos-laguna-a3412-20260514-bsc" },
  { slug: "bens-halo-halo-ice-cream", name: "Ben's Halo-halo Ice Cream", category: "Cafes & Desserts",
    place: "Los Baños, Laguna", barangay: "Poblacion",
    lat: 14.176, lng: 121.217, price_tier: 1, featured: false,
    tags: ["Desserts", "Cold Treats"], dietary_tags: [],
    description: "A long-running local name for halo-halo and ice cream in the poblacion.",
    source_url: "https://nextonyourlist.com/only-here-a-los-banos-food-trip-guide-like-this/" },
  { slug: "cafe-lucca", name: "Cafe Lucca", category: "Cafes & Desserts",
    place: "Los Baños, Laguna", barangay: "Poblacion",
    lat: 14.177, lng: 121.218, price_tier: 2, featured: false,
    tags: ["Café", "Ambience"], dietary_tags: [],
    description: "A charming, photogenic café known for its cozy, well-arranged interior.",
    source_url: "https://www.spot.ph/eatdrink/the-latest-eat-drink/spot-out-of-town-where-to-eat-in-los-banos-laguna-a3412-20260514-bsc" },
  { slug: "coffee-project-lb", name: "Coffee Project", category: "Cafes & Desserts",
    place: "Near UPLB, Los Baños", barangay: "Batong Malake",
    lat: 14.165, lng: 121.241, price_tier: 2, featured: false,
    tags: ["Café", "Coffee"], dietary_tags: [],
    description: "A campus-adjacent coffee shop popular with UPLB students and staff.",
    source_url: "https://nextonyourlist.com/only-here-a-los-banos-food-trip-guide-like-this/" },

  // ---- Baked Goods ----
  { slug: "michas-bakeshop", name: "Micha's Bakeshop", category: "Baked Goods",
    place: "Los Baños, Laguna", barangay: "Poblacion",
    lat: 14.176, lng: 121.215, price_tier: 1, featured: false,
    tags: ["Bakery", "Pastries"], dietary_tags: [],
    description: "A local bakeshop for everyday pastries and baked treats.",
    source_url: "https://nextonyourlist.com/only-here-a-los-banos-food-trip-guide-like-this/" },
  { slug: "wildbreads", name: "Wildbreads", category: "Baked Goods",
    place: "Near UPLB, Los Baños", barangay: "Batong Malake",
    lat: 14.168, lng: 121.238, price_tier: 2, featured: false,
    tags: ["Bakery", "Croissants"], dietary_tags: [],
    description: "Known for croissants, croffles, artisan breads, and matcha lattes.",
    source_url: "https://www.spot.ph/eatdrink/the-latest-eat-drink/spot-out-of-town-where-to-eat-in-los-banos-laguna-a3412-20260514-bsc" },

  // ---- Healthy Eats ----
  { slug: "satya-graha-cafe", name: "Satya Graha Cafe and Restaurant", category: "Healthy Eats",
    place: "Near Raymundo Gate, UPLB", barangay: "Batong Malake",
    lat: 14.164, lng: 121.238, price_tier: 2, featured: false,
    tags: ["Vegan", "Filipino", "Plant-Based"], dietary_tags: ["Vegetarian", "Vegan"],
    description: "A completely meat-free menu with vegan versions of Filipino classics like Bicol Express and Kare-Kare.",
    source_url: "https://www.spot.ph/eatdrink/the-latest-eat-drink/spot-out-of-town-where-to-eat-in-los-banos-laguna-a3412-20260514-bsc" },

  // ---- Filipino Classics ----
  { slug: "faustinas", name: "Faustina's", category: "Filipino Classics",
    place: "Near Raymundo Gate, UPLB", barangay: "Batong Malake",
    lat: 14.163, lng: 121.237, price_tier: 3, featured: false,
    tags: ["Filipino", "Grill"], dietary_tags: [],
    description: "An intimate, date-friendly spot known for its Silindro Ribs — char-grilled prime pork ribs in a signature barbecue sauce.",
    source_url: "https://www.spot.ph/eatdrink/the-latest-eat-drink/spot-out-of-town-where-to-eat-in-los-banos-laguna-a3412-20260514-bsc" },
  { slug: "bonitos-bar-restaurant", name: "Bonitos Bar & Restaurant", category: "Filipino Classics",
    place: "Los Baños, Laguna", barangay: "Batong Malake",
    lat: 14.170, lng: 121.230, price_tier: 3, featured: false,
    tags: ["Filipino", "Asian", "Comfort Food"], dietary_tags: [],
    description: "A diverse menu of Filipino favorites, Asian comfort food, and Italian entrees.",
    source_url: "https://www.spot.ph/eatdrink/the-latest-eat-drink/spot-out-of-town-where-to-eat-in-los-banos-laguna-a3412-20260514-bsc" },

  // ---- Drinks & Beverages ----
  { slug: "nham-cha-thai-milk-tea", name: "Nham Cha Thai Milk Tea", category: "Drinks & Beverages",
    place: "Near UPLB, Los Baños", barangay: "Batong Malake",
    lat: 14.166, lng: 121.240, price_tier: 1, featured: false,
    tags: ["Drinks", "Milk Tea"], dietary_tags: [],
    description: "A Thai milk tea spot popular with the UPLB crowd.",
    source_url: "https://nextonyourlist.com/only-here-a-los-banos-food-trip-guide-like-this/" },
];

const rows = items.map(({ slug, name, category, place, barangay, lat, lng, price_tier, featured, tags, dietary_tags, description, source_url }) => ({
  slug, name, category, place, barangay, lat, lng, price_tier, featured, tags, dietary_tags, description, source_url,
  hero_image: scene(), rating: null, review_count: 0,
}));

await db.from("delicacies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
const { error } = await db.from("delicacies").insert(rows);
if (error) { console.error("✗", error.message); process.exit(1); }
console.log(`✓ delicacies (${rows.length})`);
