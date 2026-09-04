-- The 17-site Los Baños Heritage Walk (from the Municipality's "Discover Los Baños" guide).
-- A self-guided trail — its own table so it stays a first-class feature rather than
-- squeezing into event schedule items.

create table public.heritage_walk_stops (
  id              uuid primary key default gen_random_uuid(),
  sort            int not null,
  name            text not null,
  blurb           text not null,
  era_group       text not null,
  lat             double precision,
  lng             double precision,
  is_passport_spot boolean not null default false,
  created_at      timestamptz not null default now()
);

create index on public.heritage_walk_stops (sort);

alter table public.heritage_walk_stops enable row level security;
create policy "heritage_walk_stops: public read" on public.heritage_walk_stops for select using (true);
create policy "heritage_walk_stops: admin write" on public.heritage_walk_stops for all using (public.is_admin()) with check (public.is_admin());
