alter table public.ride_routes add column if not exists image text;
alter table public.ride_routes add column if not exists stops text[];
alter table public.ride_routes add column if not exists travel_time_text text;
