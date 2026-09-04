-- Real coordinates for the map surfaces. `events` and `passport_locations`
-- already carry lat/lng; `delicacies` / `accommodations` / `parking_spots`
-- carry the columns (added in their own migrations) but no values yet.
-- Here we add coords to the two tables that lack the columns entirely.

alter table public.destinations
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table public.tour_itinerary_stops
  add column if not exists lat double precision,
  add column if not exists lng double precision;
