/* One-time migration: inserts the 33 destinations that used to be hardcoded
   in client/src/App.tsx into the new `destinations` Supabase table.
   Run once: node --env-file=.env.local scripts/seed-destinations.mjs */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const IMG = {
  hero: "/assets/kabiyahe-hero-laguna_e334210c.jpg",
  lake: "/assets/kabiyahe-calinaya-lake_96b9ff18.jpg",
  falls: "/assets/kabiyahe-pagsanjan-falls_bd37de01.jpg",
  sunset: "/assets/kabiyahe-bundles-sunset_99ff267e.jpg",
  enchantedKingdom: "/assets/enchanted-kingdom_a3aaee52.jpg",
  alFresco: "/assets/al-fresco-springs_c60eb0da.jpg",
  laresio: "/assets/laresio-lakeside_049170eb.jpg",
};

const slugify = v => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const featuredNames = new Set(["Pagsanjan Falls", "Enchanted Kingdom", "Los Baños Hot Springs", "Laresio Lakeside Resort & Spa"]);

const raw = [
  { name: "Pagsanjan Falls", place: "Pagsanjan, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Nature", icon: "Mountain", description: "Famous waterfall connected with the historic Pagsanjan Boat Ride.", rating: "4.7", reviews: "532", tags: ["Adventure", "Waterfalls", "Hidden Gem"], price: 2 },
  { name: "Caliraya Lake", place: "Lumban, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Nature", icon: "Mountain", description: "Scenic lake perfect for boating, camping, and relaxing.", rating: "4.6", reviews: "412", tags: ["Scenic Views", "Family Friendly", "Budget Friendly"], price: 2 },
  { name: "Majayjay Church", place: "Majayjay, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: "Landmark", description: "Historic baroque church known as the Little Rome of the Philippines.", rating: "4.8", reviews: "298", tags: ["Culture", "Budget Friendly", "Hidden Gem"], price: 1 },
  { name: "Los Baños Hot Springs", place: "Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.falls], type: "Relaxation", icon: "Sparkles", description: "Warm mineral pools tucked into a lush mountain landscape.", rating: "4.7", reviews: "361", tags: ["Relaxation", "Family Friendly", "Romantic"], price: 3 },
  { name: "Nuvali Lakeside", place: "Santa Rosa, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Attractions", icon: "Compass", description: "Open-air lakeside escape with food, cycling, and sunset views.", rating: "4.5", reviews: "510", tags: ["Family Friendly", "Food", "Scenic Views"], price: 2 },
  { name: "Bato Resort", place: "Pila, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Relaxation", icon: "Sparkles", description: "A quiet countryside stop for slow mornings and cool water.", rating: "4.4", reviews: "187", tags: ["Relaxation", "Budget Friendly"], price: 1 },
  { name: "Danielitos Home Kitchen", place: "Laguna, Philippines", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.sunset], type: "Food", icon: "Utensils", description: "Placeholder restaurant listing for a home-kitchen dining stop. Details to be verified.", tags: ["Food", "Local Flavors", "Placeholder Listing"], price: 2, placeholder: true },
  { name: "Malayas Cafe", place: "Laguna, Philippines", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Food", icon: "Utensils", description: "Placeholder cafe listing for a relaxed food stop. Details to be verified.", tags: ["Food", "Cafe", "Placeholder Listing"], price: 2, placeholder: true },
  { name: "Rizal Shrine", place: "Calamba, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: "Landmark", description: "A heritage stop in Calamba, the birthplace of national hero José Rizal.", tags: ["Culture", "Heritage", "Family Friendly"], price: 1, verified: true },
  { name: "Seven Crater Lakes", place: "San Pablo City, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.falls], type: "Nature", icon: "Mountain", description: "A collection of San Pablo's seven crater lakes, including Sampaloc, Pandin, and Yambo.", tags: ["Scenic Views", "Nature", "Hidden Gem"], price: 1, verified: true },
  { name: "Mount Makiling", place: "Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.falls, IMG.lake], type: "Attractions", icon: "Mountain", description: "A landmark mountain landscape associated with hiking, fresh air, and panoramic Laguna views.", tags: ["Adventure", "Scenic Views", "Nature"], price: 2, verified: true },
  { name: "Paete Woodcarving Heritage", place: "Paete, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: "Landmark", description: "A town heritage stop celebrating Paete's longstanding tradition of intricate woodcarving.", tags: ["Culture", "Arts", "Hidden Gem"], price: 1, verified: true },
  { name: "Enchanted Kingdom", place: "Santa Rosa, Laguna", image: IMG.enchantedKingdom, gallery: [IMG.enchantedKingdom, IMG.hero, IMG.sunset], type: "Attractions", icon: "Compass", description: "A major family attraction in Santa Rosa with themed rides and attractions ranging from family-friendly experiences to extreme thrills.", tags: ["Family Friendly", "Adventure", "Attractions"], price: 3, verified: true },
  { name: "Seda Nuvali", place: "Santa Rosa, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Hotels", icon: "WalletCards", description: "A research-backed hotel stay within Nuvali's sustainable eco-city setting, close to lakeside, dining, and outdoor spaces.", tags: ["Hotels", "Scenic Views", "Family Friendly"], price: 3, verified: true },
  { name: "Sol Y Viento Hotels and Resorts", place: "Pansol, Calamba, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.sunset], type: "Hotels", icon: "WalletCards", description: "A mountain spring resort along the slopes of Mount Makiling, with accommodation, recreation, and dining on site.", tags: ["Hotels", "Relaxation", "Scenic Views"], price: 3, verified: true },
  { name: "Diwata Nature Resort", place: "San Pablo, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.lake, IMG.sunset], type: "Hotels", icon: "WalletCards", description: "A curated San Pablo lodging lead for travelers looking for a nature-oriented stay. Verify current details before booking.", tags: ["Hotels", "Nature", "Curated place"], price: 2 },
  { name: "Splash Mountain Resort", place: "Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Hotels", icon: "WalletCards", description: "A curated Los Baños resort and hotel lead. Confirm current accommodation, access, and booking details with the venue.", tags: ["Hotels", "Family Friendly", "Curated place"], price: 2 },
  { name: "Dampalit Falls", place: "Los Baños, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Nature", icon: "Mountain", description: "A quiet Los Baños waterfall trail lead for travelers looking for a short nature escape. Trail conditions, access, and fees should be confirmed before visiting.", tags: ["Waterfalls", "Nature", "Curated place"], price: 1 },
  { name: "Al Fresco Springs", place: "Brgy Tadlac, Los Baños, Laguna", image: IMG.alFresco, gallery: [IMG.alFresco, IMG.hero, IMG.lake], type: "Hotels", icon: "WalletCards", description: "A private hot spring resort group with Al Fresco 1, Al Fresco 2, and Toscana accommodations for group stays. Confirm availability and rates directly with the venue.", tags: ["Hotels", "Hot Springs", "Family Friendly"], price: 3, verified: true },
  { name: "Laresio Lakeside Resort & Spa", place: "Los Baños, Laguna", image: IMG.laresio, gallery: [IMG.laresio, IMG.lake, IMG.hero], type: "Hotels", icon: "WalletCards", description: "A lakeside Los Baños escape with private hot spring villas and water-based experiences including cliff diving, slide n' surf, and the blob. Confirm current access and booking details directly.", tags: ["Hotels", "Hot Springs", "Adventure"], price: 3, verified: true },
  { name: "Makiling Botanic Gardens", place: "UPLB Forestry Campus, Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.falls], type: "Nature", icon: "Mountain", description: "A UPLB living laboratory and plant museum in the Mount Makiling forest landscape, with endemic and tropical plant collections. Visitor access and current hours should be confirmed with UPLB.", tags: ["Nature", "Science", "Family Friendly"], price: 1, verified: true },
  { name: "UPLB Museum of Natural History", place: "UPLB Campus, Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.hero, IMG.sunset], type: "Attractions", icon: "Landmark", description: "An institutional museum showcasing Philippine biodiversity and natural-history collections. Check the museum's official visitor information before planning a visit.", tags: ["Science", "Education", "Family Friendly"], price: 1, verified: true },
  { name: "UPLB Fertility Tree", place: "UPLB Campus, Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.lake, IMG.sunset], type: "Culture", icon: "Landmark", description: "A well-known UPLB campus landmark associated with local stories and visitor photo stops. Treat it as a respectful public-campus visit and confirm access rules.", tags: ["Heritage", "Culture", "Campus Walk"], price: 1 },
  { name: "Sining Makiling Gallery", place: "UPLB Campus, Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: "Landmark", description: "A UPLB arts and exhibition stop listed in the university's visitor attractions. Exhibition schedules and access may vary.", tags: ["Arts", "Culture", "Education"], price: 1, verified: true },
  { name: "Makiling Mud Spring", place: "Mount Makiling, Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.falls, IMG.lake], type: "Nature", icon: "Mountain", description: "A geothermal feature associated with Mount Makiling's volcanic landscape. Follow current trail, safety, and access guidance before visiting.", tags: ["Nature", "Geothermal", "Adventure"], price: 1 },
  { name: "Flat Rocks", place: "Mount Makiling, Los Baños, Laguna", image: IMG.falls, gallery: [IMG.falls, IMG.hero, IMG.lake], type: "Nature", icon: "Mountain", description: "A natural rock formation and trek stop in the Mount Makiling area. Trail access and conditions should be checked locally before departure.", tags: ["Nature", "Hiking", "Adventure"], price: 1 },
  { name: "IRRI Riceworld Museum", place: "Pili Drive, Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Attractions", icon: "Landmark", description: "An educational rice-science and culture stop associated with the International Rice Research Institute. Visitor and experiential-tour access must be arranged through IRRI.", tags: ["Science", "Education", "Culture"], price: 1, verified: true },
  { name: "Philippine Carabao Center at UPLB", place: "UPLB Campus, Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.hero, IMG.sunset], type: "Attractions", icon: "Compass", description: "A research and education facility connected with Philippine carabao science and agriculture. Public access and learning visits require confirmation.", tags: ["Science", "Education", "Family Friendly"], price: 1 },
  { name: "Diocesan Shrine of St. Therese of the Child Jesus", place: "UPLB Campus, Batong Malake, Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: "Landmark", description: "A church and devotional landmark along Victoria M. Ela Street inside the UPLB area. Visitors should observe worship schedules and site etiquette.", tags: ["Heritage", "Culture", "Spiritual"], price: 1 },
  { name: "San Antonio de Padua Parish", place: "Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Culture", icon: "Landmark", description: "A Los Baños parish landmark surfaced in local landmark references. Confirm current mass schedules and visitor access with the parish.", tags: ["Heritage", "Culture", "Spiritual"], price: 1 },
  { name: "Los Baños Municipal Hall & History", place: "Los Baños, Laguna", image: IMG.hero, gallery: [IMG.hero, IMG.sunset, IMG.lake], type: "Culture", icon: "Landmark", description: "A civic-history stop for learning about Los Baños' hot-spring origins, Mount Makiling setting, and local heritage. This is an exterior/history lead rather than a guaranteed tour.", tags: ["Heritage", "History", "Culture"], price: 1, verified: true },
  { name: "Los Baños Public Market", place: "Los Baños, Laguna", image: IMG.sunset, gallery: [IMG.sunset, IMG.hero, IMG.lake], type: "Food", icon: "Utensils", description: "A community food and everyday-shopping lead for local produce, prepared food, and Laguna pasalubong. Stall selection and operating times vary.", tags: ["Food", "Local Flavors", "Community"], price: 1 },
  { name: "Olivarez Plaza", place: "Los Baños, Laguna", image: IMG.lake, gallery: [IMG.lake, IMG.sunset, IMG.hero], type: "Attractions", icon: "Compass", description: "A central public-space lead surfaced in Los Baños landmark references. Confirm current activity, events, and access before visiting.", tags: ["Community", "Culture", "Budget Friendly"], price: 1 },
];

const rows = raw.map(d => ({
  slug: slugify(d.name),
  name: d.name,
  place: d.place,
  type: d.type,
  icon_key: d.icon,
  description: d.description,
  hero_image: d.image,
  gallery: d.gallery,
  rating: d.rating ? Number(d.rating) : null,
  review_count: d.reviews ? Number(d.reviews) : null,
  tags: d.tags,
  price_tier: d.price,
  placeholder: Boolean(d.placeholder),
  verified: Boolean(d.verified),
  featured: featuredNames.has(d.name),
}));

const { error } = await supabase.from("destinations").upsert(rows, { onConflict: "slug" });
if (error) { console.error(error.message); process.exitCode = 1; }
else console.log(`Seeded ${rows.length} destinations.`);
