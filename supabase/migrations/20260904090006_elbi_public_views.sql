-- The public views intentionally bypass RLS on their base tables so that anon
-- can read the code-free / id-only projections. Recreate them as SECURITY
-- DEFINER (owner = postgres) views instead of security_invoker.

drop view if exists public.passport_locations_public;
create view public.passport_locations_public as
  select id, slug, name, category, lat, lng, active, event_id, tour_package_id, created_at
  from public.passport_locations
  where active;

drop view if exists public.profiles_public;
create view public.profiles_public as
  select id, display_name, explorer_level from public.profiles;

grant select on public.passport_locations_public to anon, authenticated;
grant select on public.profiles_public to anon, authenticated;
