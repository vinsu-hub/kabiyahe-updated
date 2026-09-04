/* ELBI ("Come Curious") — frontend mock data.
   No backend: these fixtures drive the Events, Bus Tours, Passport and Ride Guide
   tabs until the real tRPC/Postgres layer is wired. Swap /scenes/elbi-*.svg for
   real Los Baños photography when available. */

export const IMG = {
  hero: "/scenes/elbi-hero.svg",
  lake: "/scenes/elbi-lake.svg",
  falls: "/scenes/elbi-falls.svg",
  sunset: "/scenes/elbi-sunset.svg",
  heritage: "/scenes/elbi-heritage.svg",
  campus: "/scenes/elbi-campus.svg",
  market: "/scenes/elbi-market.svg",
  food: "/scenes/elbi-food.svg",
  passport: "/scenes/elbi-passport.svg",
  bus: "/scenes/elbi-bus.svg",
  mark: "/brand/elbi-mark.png",
  logoH: "/brand/elbi-logo-horizontal.png",
};

export const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const SEASONS = [
  { q: "Q1", key: "banada", name: "ELBI Bañada", months: "February", pillars: "Art · Heritage · Culture" },
  { q: "Q2", key: "sol-open", name: "Sol Open", months: "April", pillars: "Nature · Sport · Wellness" },
  { q: "Q3", key: "sibol", name: "Sibol Weekend Market", months: "July", pillars: "Ideas · Innovation · Enterprise" },
  { q: "Q4", key: "makiling-enchanted", name: "Makiling Enchanted", months: "December", pillars: "Community · Tradition · Celebration" },
] as const;

export const CURRENT_SEASON = SEASONS[0];

export type EventCategory = "Culture" | "Sports" | "Arts" | "Community";
export type EventStatus = "live" | "today" | "week" | "season" | "recap";

export interface ElbiEvent {
  id: string;
  title: string;
  category: EventCategory;
  season: string;
  date: string;
  time: string;
  venue: string;
  barangay: string;
  attendees: number;
  status: EventStatus;
  image: string;
  organizer: string;
  description: string;
  schedule: { time: string; item: string; state?: "done" | "live" | "next" }[];
  updates: { ago: string; text: string }[];
  lat: number;
  lng: number;
}

export const EVENTS: ElbiEvent[] = [
  {
    id: "uplb-feb-fair-2025", title: "UPLB Feb Fair 2025", category: "Community", season: "banada",
    date: "Feb 15, 2026", time: "5:00 PM", venue: "UPLB Freedom Park", barangay: "Batong Malake",
    attendees: 1284, status: "live", image: IMG.market, organizer: "UP Los Baños University Student Council",
    description: "The biggest campus-wide fair of the year — concert nights, org booths, food stalls, and a fireworks finale across a week of programming at Freedom Park.",
    schedule: [
      { time: "5:00 PM", item: "Opening Program", state: "done" },
      { time: "6:00 PM", item: "Student Performances", state: "live" },
      { time: "7:30 PM", item: "Band Performance", state: "next" },
      { time: "9:00 PM", item: "Fireworks Show", state: "next" },
    ],
    updates: [{ ago: "10 mins ago", text: "Program update: Fireworks moved to 9:00 PM due to weather." }],
    lat: 14.165, lng: 121.241,
  },
  {
    id: "likha-music-arts-festival", title: "Likha Music & Arts Festival", category: "Arts", season: "banada",
    date: "Feb 14, 2026", time: "7:00 PM", venue: "Baker Hall, UPLB", barangay: "Batong Malake",
    attendees: 430, status: "today", image: IMG.heritage, organizer: "Likha Collective",
    description: "An evening of local bands, spoken word, and a pop-up art market celebrating Los Baños creatives during Bañada season.",
    schedule: [
      { time: "7:00 PM", item: "Art market opens" },
      { time: "8:00 PM", item: "Live sets begin" },
      { time: "10:30 PM", item: "Closing jam" },
    ],
    updates: [],
    lat: 14.164, lng: 121.239,
  },
  {
    id: "art-in-the-park-popup", title: "Art in the Park Pop-up Market", category: "Arts", season: "banada",
    date: "Feb 15, 2026", time: "9:00 AM", venue: "Old Pantalan, Los Baños", barangay: "Bayog",
    attendees: 210, status: "today", image: IMG.lake, organizer: "Los Baños Tourism Office",
    description: "A morning lakeside market with handmade crafts, prints, and merienda from Los Baños makers.",
    schedule: [{ time: "9:00 AM", item: "Stalls open" }, { time: "12:00 NN", item: "Market closes" }],
    updates: [],
    lat: 14.178, lng: 121.243,
  },
  {
    id: "makiling-trail-run", title: "Makiling Trail Run", category: "Sports", season: "sol-open",
    date: "Apr 12, 2026", time: "5:30 AM", venue: "UPLB College of Forestry", barangay: "Bagong Silang",
    attendees: 540, status: "season", image: IMG.campus, organizer: "Elbi Runners Club",
    description: "A 10K and 21K trail race on the lower slopes of Mt. Makiling, opening the Sol Open nature season.",
    schedule: [{ time: "5:30 AM", item: "21K gun start" }, { time: "6:00 AM", item: "10K gun start" }, { time: "9:00 AM", item: "Awarding" }],
    updates: [],
    lat: 14.148, lng: 121.239,
  },
  {
    id: "bay-heritage-walk", title: "Los Baños Heritage Walk", category: "Culture", season: "banada",
    date: "Feb 22, 2026", time: "8:00 AM", venue: "Meet at San Antonio de Padua Parish", barangay: "Poblacion",
    attendees: 96, status: "season", image: IMG.heritage, organizer: "Los Baños Museum",
    description: "A guided two-hour walk through the town's heritage core — the parish, the old bath houses, and heritage homes along the poblacion.",
    schedule: [{ time: "8:00 AM", item: "Assembly & briefing" }, { time: "8:15 AM", item: "Walk begins" }, { time: "10:15 AM", item: "Wrap-up at the museum" }],
    updates: [],
    lat: 14.177, lng: 121.219,
  },
  {
    id: "sibol-weekend-market", title: "Sibol Weekend Market", category: "Community", season: "sibol",
    date: "Jul 5, 2026", time: "4:00 PM", venue: "Ruby St., Umali Subdivision", barangay: "Batong Malake",
    attendees: 320, status: "season", image: IMG.market, organizer: "ElBi Community Market",
    description: "The recurring weekend market of makers, growers, and student startups that anchors the Sibol enterprise season.",
    schedule: [{ time: "4:00 PM", item: "Market opens" }, { time: "10:00 PM", item: "Market closes" }],
    updates: [],
    lat: 14.170, lng: 121.240,
  },
  {
    id: "makiling-enchanted-lantern", title: "Makiling Enchanted Lantern Nights", category: "Community", season: "makiling-enchanted",
    date: "Dec 12, 2026", time: "6:00 PM", venue: "UPLB Carillon Plaza", barangay: "Batong Malake",
    attendees: 780, status: "season", image: IMG.sunset, organizer: "UPLB Office for Initiatives in Culture and the Arts",
    description: "Lantern installations, a choir festival, and a community countdown opening the Makiling Enchanted holiday season.",
    schedule: [{ time: "6:00 PM", item: "Lantern lighting" }, { time: "7:00 PM", item: "Choir festival" }, { time: "9:00 PM", item: "Community countdown" }],
    updates: [],
    lat: 14.164, lng: 121.240,
  },
  {
    id: "elbi-feb-fair-2024-recap", title: "UPLB Feb Fair 2024 — Recap", category: "Community", season: "banada",
    date: "Feb 2024", time: "—", venue: "UPLB Freedom Park", barangay: "Batong Malake",
    attendees: 1284, status: "recap", image: IMG.market, organizer: "UP Los Baños University Student Council",
    description: "Last year's fair drew record crowds across three days — 42 vendors, 18 activities, and a sold-out concert night.",
    schedule: [],
    updates: [],
    lat: 14.165, lng: 121.241,
  },
];

export const PASSPORT_SPOTS = [
  { id: "makiling-botanic-gardens", name: "Makiling Botanic Gardens", category: "Nature", distance: "420 m" },
  { id: "los-banos-museum", name: "Los Baños Museum", category: "Culture", distance: "680 m" },
  { id: "buko-pie-house", name: "Buko Pie House", category: "Food", distance: "850 m" },
  { id: "irri-riceworld", name: "IRRI Riceworld Museum", category: "Science", distance: "1.2 km" },
];

/* ---- Bus Tours ---- */

export interface TourPackage {
  id: string;
  title: string;
  tags: string[];
  duration: string;
  pricePerSeat: number;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  seasonTag?: string;
  operatorName: string;
  originPickupPoints: string[];
  departureSchedule: string;
  seatCapacity: number;
  seatsAvailable: number;
  includes: string[];
  image: string;
  summary: string;
  reserveUrl: string;
  itineraryStops: { time: string; name: string; blurb: string }[];
  reviews: { name: string; rating: number; text: string }[];
}

export const TOURS: TourPackage[] = [
  {
    id: "makiling-explorer-tour", title: "Makiling Explorer Tour", tags: ["Nature", "Culture"],
    duration: "1 Day", pricePerSeat: 1499, rating: 4.8, reviewCount: 32, featured: true,
    operatorName: "Laguna Heritage Coaches", originPickupPoints: ["Manila (Cubao)", "Calamba Crossing"],
    departureSchedule: "Saturdays, 6:00 AM departure · 6:00 PM return",
    seatCapacity: 40, seatsAvailable: 12,
    includes: ["Air-conditioned coach", "Licensed tour guide", "Botanic Gardens entrance", "Lunch"],
    image: IMG.campus,
    summary: "A full day across Mt. Makiling's lower slopes — Botanic Gardens, Dampalit Falls, and Tadlac Lake — with a heritage stop in the poblacion.",
    reserveUrl: "https://example.com/lagunaheritagecoaches/makiling-explorer",
    itineraryStops: [
      { time: "8:00 AM", name: "Makiling Botanic Gardens", blurb: "Guided walk through the UPLB living plant museum." },
      { time: "10:30 AM", name: "Dampalit Falls", blurb: "Short trail to the falls; dip stop for those who want one." },
      { time: "12:30 PM", name: "Lunch — Los Baños poblacion", blurb: "Set lunch featuring local dishes and buko pie." },
      { time: "2:30 PM", name: "Los Baños Museum & Heritage Walk", blurb: "The parish, old bath houses, and heritage homes." },
      { time: "4:00 PM", name: "Tadlac Lake View Deck", blurb: "Golden-hour stop before the return trip." },
    ],
    reviews: [
      { name: "Marco P.", rating: 5, text: "Great pacing and the guide knew every plant in the gardens. Worth it." },
      { name: "Anna R.", rating: 4, text: "Loved the falls. Lunch could be bigger but overall a smooth day." },
    ],
  },
  {
    id: "heritage-science-journey", title: "Heritage & Science Journey", tags: ["Culture", "Science"],
    duration: "1 Day", pricePerSeat: 1299, rating: 4.7, reviewCount: 18,
    seasonTag: "banada",
    operatorName: "ElBi Discovery Tours", originPickupPoints: ["Manila (Ortigas)", "Sta. Rosa"],
    departureSchedule: "Second & fourth Sundays, 6:30 AM departure",
    seatCapacity: 35, seatsAvailable: 20,
    includes: ["Air-conditioned coach", "Licensed tour guide", "IRRI Riceworld arranged visit", "Merienda"],
    image: IMG.heritage,
    summary: "The town's heritage core paired with its science institutions — the parish and museum in the morning, IRRI and the Museum of Natural History after lunch.",
    reserveUrl: "https://example.com/elbidiscovery/heritage-science",
    itineraryStops: [
      { time: "9:00 AM", name: "San Antonio de Padua Parish", blurb: "Start of the heritage core walk." },
      { time: "10:00 AM", name: "Los Baños Museum", blurb: "Local history from the hot-spring town's origins." },
      { time: "12:00 NN", name: "Lunch — campus town", blurb: "Set lunch near UPLB." },
      { time: "1:30 PM", name: "IRRI Riceworld Museum", blurb: "Rice science and culture, arranged visit." },
      { time: "3:30 PM", name: "UPLB Museum of Natural History", blurb: "Philippine biodiversity collections." },
    ],
    reviews: [
      { name: "Grace L.", rating: 5, text: "The IRRI visit alone was worth the trip. Very well organised." },
    ],
  },
  {
    id: "uplb-campus-flavors-tour", title: "UPLB Campus & Flavors Tour", tags: ["Food", "Culture"],
    duration: "Half Day", pricePerSeat: 899, rating: 4.6, reviewCount: 24,
    operatorName: "ElBi Discovery Tours", originPickupPoints: ["Calamba Crossing", "Los Baños Grove"],
    departureSchedule: "Daily, 1:00 PM departure · 6:00 PM return",
    seatCapacity: 30, seatsAvailable: 8,
    includes: ["Air-conditioned coach", "Licensed guide", "Food tasting at 3 stops"],
    image: IMG.food,
    summary: "An afternoon campus loop — Freedom Park, the Carillon, the Fertility Tree — threaded with buko pie, espasol, and a kesong puti tasting.",
    reserveUrl: "https://example.com/elbidiscovery/campus-flavors",
    itineraryStops: [
      { time: "1:30 PM", name: "UPLB Freedom Park & Carillon", blurb: "Campus landmarks and the story behind them." },
      { time: "2:30 PM", name: "Buko Pie House", blurb: "Tasting stop — the Los Baños classic." },
      { time: "3:30 PM", name: "Baker Hall & Fertility Tree", blurb: "Heritage architecture and campus lore." },
      { time: "4:30 PM", name: "Kesong Puti & espasol tasting", blurb: "Local delicacies from nearby makers." },
    ],
    reviews: [
      { name: "Jamie T.", rating: 5, text: "Perfect for a half day. So much food." },
      { name: "Karl M.", rating: 4, text: "Fun and casual. Wish it was a bit longer." },
    ],
  },
];

/* ---- Passport ---- */

export const PASSPORT = {
  explorerLevel: 3,
  xp: 1250,
  xpToNext: 2000,
  stampsCollected: 8,
  stampsTotal: 30,
  categories: [
    { name: "Nature", collected: 3, tone: "sage" },
    { name: "Culture", collected: 2, tone: "maroon" },
    { name: "Food", collected: 2, tone: "gold" },
    { name: "Science", collected: 1, tone: "teal" },
    { name: "Event", collected: 0, tone: "maroon" },
    { name: "Community", collected: 0, tone: "gold" },
  ],
  nearby: PASSPORT_SPOTS,
  rewards: [
    { title: "10% Off Local Partner Voucher", status: "locked", note: "Collect 3 more stamps to unlock" },
    { title: "Free buko pie slice — Buko Pie House", status: "available", note: "Redeem in-store · expires Mar 31" },
  ],
  seasonTrack: {
    season: "banada",
    collected: 3,
    total: 6,
    checklist: [
      { name: "Heritage", done: true }, { name: "Culture", done: true }, { name: "Art", done: true },
      { name: "Community", done: false }, { name: "Science", done: false }, { name: "Nature", done: false },
    ],
  },
  /* codes that "work" in the mock manual-entry scanner */
  validCodes: {
    "ELBI-MAKILING": { name: "Makiling Discovery", category: "Nature" },
    "ELBI-MUSEUM": { name: "Los Baños Museum", category: "Culture" },
    "ELBI-BUKOPIE": { name: "Buko Pie House", category: "Food" },
    "ELBI-IRRI": { name: "IRRI Riceworld", category: "Science" },
  } as Record<string, { name: string; category: string }>,
};

/* ---- Ride Guide ---- */

export const JEEP_ROUTES = [
  { route: "UPLB ↔ Los Baños Town Proper", mode: "Jeepney", fare: "₱13 est.", frequency: "every 5–10 min", note: "Main line along the National Highway. Say 'para' one landmark before your stop." },
  { route: "UPLB ↔ Bay", mode: "Jeepney", fare: "₱15 est.", frequency: "every 10–15 min", note: "Board at the Grove terminal. Pass fare forward — 'bayad po'." },
  { route: "UPLB ↔ Calauan", mode: "Jeepney", fare: "₱20 est.", frequency: "every 15 min", note: "Long-haul line; sit toward the front for an easier exit." },
  { route: "Crossing ↔ Grove", mode: "Jeepney", fare: "₱12 est.", frequency: "every 5 min", note: "Short hop that covers most of the campus-town strip." },
];

export const TRICYCLE_ZONES = [
  { zone: "Zone 1 — Batong Malake / Grove", fare: "₱30 special · ₱12 sharing", note: "Covers the Grove dining strip and Umali Subdivision." },
  { zone: "Zone 2 — Poblacion / Bayog", fare: "₱35 special", note: "Town hall, public market, and the parish." },
  { zone: "Zone 3 — Anos / Mayondon", fare: "₱40 special", note: "Toward the lakeshore barangays; agree on fare before boarding." },
];

export const RIDE_TIPS = [
  "Jeepney stops aren't marked — flag one down anywhere it's safe to pull over, and knock on the roof or say 'para' to get off.",
  "Have coins ready. Hand your fare forward and say 'bayad po'; the driver passes change back the same way.",
  "Tricycles are door-to-door within a zone. Confirm 'special' (private) vs 'sharing' and the fare before you sit down.",
  "After dark on Mt. Makiling routes, arrange a return ride in advance — service thins out past 8 PM.",
];
