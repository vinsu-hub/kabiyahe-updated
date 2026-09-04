-- Parking spots: informational only, no booking/payment fields.

create table public.parking_spots (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  place             text,
  barangay          text,
  lat               double precision,
  lng               double precision,
  kind              text not null check (kind in ('free','paid')),
  fee_label         text,
  capacity_estimate text,
  hours_label       text,
  notes             text,
  hero_image        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.parking_spots (kind);

alter table public.parking_spots enable row level security;
create policy "parking_spots: public read" on public.parking_spots for select using (true);
create policy "parking_spots: admin write" on public.parking_spots for all using (public.is_admin()) with check (public.is_admin());
