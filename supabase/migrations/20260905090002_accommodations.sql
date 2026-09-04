-- Accommodations: real Los Baños stays (Stay & Eat "Stay" half).
-- The "Eat" half of Stay & Eat reuses the delicacies table filtered by place,
-- rather than duplicating restaurant data in a second table.

create table public.accommodations (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  category           text not null check (category in ('Hotel','Resort','Homestay')),
  place              text,
  barangay           text,
  lat                double precision,
  lng                double precision,
  price_range        text,
  amenities          text[] not null default '{}',
  description        text,
  hero_image         text,
  booking_referral_url text,
  rating             numeric(2,1),
  review_count       int not null default 0,
  featured           boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index on public.accommodations (category);

alter table public.accommodations enable row level security;
create policy "accommodations: public read" on public.accommodations for select using (true);
create policy "accommodations: admin write" on public.accommodations for all using (public.is_admin()) with check (public.is_admin());
