/* Hand-authored row types for the El-Biyahe! Supabase schema.
   (CLI `gen types` needs Docker locally, which isn't available — keep these in
   sync with supabase/migrations/*.sql by hand.) */

export type EventCategory = "Culture" | "Sports" | "Arts" | "Community";
export type EventStatus = "live" | "today" | "week" | "season" | "recap";
export type StampCategory = "Nature" | "Culture" | "Food" | "Science" | "Event" | "Community";

export interface Season {
  key: string;
  quarter: string;
  name: string;
  months: string;
  pillars: string;
  is_current: boolean;
  sort: number;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  season_key: string | null;
  status: EventStatus;
  date_label: string | null;
  time_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue_name: string | null;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  attendee_count: number;
  hero_image: string | null;
  organizer: string | null;
  description: string | null;
}

export interface EventScheduleItem {
  id: string;
  event_id: string;
  time_label: string;
  item: string;
  state: "done" | "live" | "next" | null;
  sort: number;
}

export interface EventUpdate {
  id: string;
  event_id: string;
  ago_label: string | null;
  body: string;
  created_at: string;
}

export interface EventDetailRow extends EventRow {
  event_schedule_items: EventScheduleItem[];
  event_updates: EventUpdate[];
}

export interface TourOperator {
  id: string;
  name: string;
}

export interface TourPackageRow {
  id: string;
  slug: string;
  operator_id: string;
  title: string;
  tags: string[];
  duration: string | null;
  price_per_seat: number;
  rating: number;
  review_count: number;
  featured: boolean;
  season_key: string | null;
  origin_pickup_points: string[];
  departure_schedule: string | null;
  seat_capacity: number;
  seats_available: number;
  includes: string[];
  hero_image: string | null;
  summary: string | null;
  reserve_url: string | null;
  status: "draft" | "active" | "archived";
}

export interface TourItineraryStop {
  id: string;
  package_id: string;
  time_label: string;
  name: string;
  blurb: string | null;
  sort: number;
}

export interface TourReview {
  id: string;
  package_id: string;
  author_name: string;
  rating: number;
  body: string | null;
}

export interface TourPackageDetail extends TourPackageRow {
  tour_operators: TourOperator | null;
  tour_itinerary_stops: TourItineraryStop[];
  tour_reviews: TourReview[];
}

export interface PassportLocationPublic {
  id: string;
  slug: string;
  name: string;
  category: StampCategory;
  lat: number | null;
  lng: number | null;
  active: boolean;
  event_id: string | null;
  tour_package_id: string | null;
}

export interface PassportReward {
  id: string;
  title: string;
  description: string | null;
  tier: string | null;
  required_stamps: number;
  active: boolean;
}

export interface RideRoute {
  id: string;
  kind: "jeep" | "tricycle_zone";
  label: string;
  mode: string | null;
  fare_text: string | null;
  frequency_text: string | null;
  note: string | null;
  sort: number;
}

export interface RideTip {
  id: string;
  body: string;
  sort: number;
}

export interface Profile {
  id: string;
  display_name: string | null;
  role: "user" | "partner" | "admin";
  explorer_level: number;
  xp: number;
}

export type DelicacyCategory = "Local Favorites" | "Street Food" | "Baked Goods" | "Dairy & Desserts" | "Market Finds";

export interface DelicacyRow {
  id: string;
  slug: string;
  name: string;
  category: DelicacyCategory;
  place: string | null;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  hero_image: string | null;
  price_tier: number;
  rating: number | null;
  review_count: number;
  tags: string[];
  source_url: string | null;
  featured: boolean;
}

export type AccommodationCategory = "Hotel" | "Resort" | "Homestay";

export interface AccommodationRow {
  id: string;
  slug: string;
  name: string;
  category: AccommodationCategory;
  place: string | null;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  price_range: string | null;
  amenities: string[];
  description: string | null;
  hero_image: string | null;
  booking_referral_url: string | null;
  rating: number | null;
  review_count: number;
  featured: boolean;
}

export interface ParkingSpotRow {
  id: string;
  slug: string;
  name: string;
  place: string | null;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  kind: "free" | "paid";
  fee_label: string | null;
  capacity_estimate: string | null;
  hours_label: string | null;
  notes: string | null;
  hero_image: string | null;
}

export interface ScanResult {
  ok: boolean;
  reason?: "auth" | "not_found" | "rate_limited" | "too_far" | "already";
  message?: string;
  name?: string;
  category?: StampCategory;
  stamps_collected?: number;
  distance_m?: number;
}
