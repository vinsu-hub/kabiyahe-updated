-- Adds a mystery-slot flag so a passport location can be scannable (active=true, real
-- coords + QR) while staying out of the pre-scan public stamps grid. The client filters
-- it out of the visible list until the user has scanned it; scan_passport itself is
-- unaffected since it never checked is_mystery.

alter table public.passport_locations
  add column if not exists is_mystery boolean not null default false;

comment on column public.passport_locations.is_mystery is
  'True = hidden from the public stamps grid until the user has scanned it. Still returned '
  'by passport_locations_public (still gated by active=true) so scanning still works — the '
  'client filters it out of the visible grid pre-scan.';

drop view if exists public.passport_locations_public;
create view public.passport_locations_public as
  select id, slug, name, category, lat, lng, active, event_id, tour_package_id, created_at, is_mystery
  from public.passport_locations
  where active;
grant select on public.passport_locations_public to anon, authenticated;
