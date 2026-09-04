-- Destinations: the Explore catalog, migrated off the hardcoded App.tsx array.

create table public.destinations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  place         text,
  type          text not null check (type in ('Nature','Culture','Relaxation','Attractions','Food','Hotels')),
  icon_key      text not null default 'Compass',
  description   text,
  hero_image    text,
  gallery       text[] not null default '{}',
  rating        numeric(2,1),
  review_count  int,
  tags          text[] not null default '{}',
  price_tier    int not null default 1,
  placeholder   boolean not null default false,
  verified      boolean not null default false,
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.destinations (type);

alter table public.destinations enable row level security;
create policy "destinations: public read" on public.destinations for select using (true);
create policy "destinations: admin write" on public.destinations for all using (public.is_admin()) with check (public.is_admin());
