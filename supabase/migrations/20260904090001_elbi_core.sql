-- ELBI core schema (client-direct Supabase). Postgres.
-- Tables: identity, reference, events, bus tours, passport, ride guide.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ identity

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  role          text not null default 'user' check (role in ('user','partner','admin')),
  explorer_level int not null default 1,
  xp            int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. role drives admin access.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Block non-admins from changing their own role.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger guard_profile_role_update
  before update on public.profiles
  for each row execute function public.guard_profile_role();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ----------------------------------------------------------------- reference

create table public.seasons (
  key        text primary key,
  quarter    text not null,
  name       text not null,
  months     text not null,
  pillars    text not null,
  is_current boolean not null default false,
  sort       int not null default 0
);

-- -------------------------------------------------------------------- events

create table public.events (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  category       text not null check (category in ('Culture','Sports','Arts','Community')),
  season_key     text references public.seasons(key),
  status         text not null default 'week' check (status in ('live','today','week','season','recap')),
  date_label     text,
  time_label     text,
  starts_at      timestamptz,
  ends_at        timestamptz,
  venue_name     text,
  barangay       text,
  lat            double precision,
  lng            double precision,
  attendee_count int not null default 0,
  hero_image     text,
  organizer      text,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.event_schedule_items (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  time_label text not null,
  item       text not null,
  state      text check (state in ('done','live','next')),
  sort       int not null default 0
);

create table public.event_updates (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  ago_label  text,
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ------------------------------------------------------------------ bus tours

create table public.tour_operators (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  license_info  text,
  status        text not null default 'active' check (status in ('pending','active','rejected','suspended')),
  created_at    timestamptz not null default now()
);

create table public.tour_packages (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  operator_id          uuid not null references public.tour_operators(id) on delete cascade,
  title                text not null,
  tags                 text[] not null default '{}',
  duration             text,
  price_per_seat       int not null default 0,
  rating               numeric(2,1) not null default 0,
  review_count         int not null default 0,
  featured             boolean not null default false,
  season_key           text references public.seasons(key),
  origin_pickup_points text[] not null default '{}',
  departure_schedule   text,
  seat_capacity        int not null default 0,
  seats_available      int not null default 0,
  includes             text[] not null default '{}',
  hero_image           text,
  summary              text,
  reserve_url          text,
  status               text not null default 'active' check (status in ('draft','active','archived')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.tour_itinerary_stops (
  id         uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.tour_packages(id) on delete cascade,
  time_label text not null,
  name       text not null,
  blurb      text,
  sort       int not null default 0
);

create table public.tour_reviews (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references public.tour_packages(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating      int not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now()
);

create table public.tour_reservations (
  id         uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.tour_packages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  seats      int not null default 1 check (seats between 1 and 20),
  status     text not null default 'requested' check (status in ('requested','confirmed','cancelled')),
  created_at timestamptz not null default now()
);
comment on table public.tour_reservations is 'Referral-only. No payment is processed by ELBI.';

create table public.referral_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  entity_id  uuid,
  user_id    uuid references auth.users(id) on delete set null,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------- passport

create table public.passport_locations (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  category        text not null check (category in ('Nature','Culture','Food','Science','Event','Community')),
  lat             double precision,
  lng             double precision,
  qr_code         text not null unique,
  active          boolean not null default true,
  event_id        uuid references public.events(id) on delete set null,
  tour_package_id uuid references public.tour_packages(id) on delete set null,
  created_at      timestamptz not null default now()
);
comment on column public.passport_locations.qr_code is 'Never exposed to clients — use passport_locations_public view for reads.';

-- Public surface for the map/list: everything except the scannable code.
create view public.passport_locations_public
with (security_invoker = true) as
  select id, slug, name, category, lat, lng, active, event_id, tour_package_id, created_at
  from public.passport_locations
  where active;

create table public.passport_scans (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.passport_locations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  unique (location_id, user_id)
);

create table public.passport_rewards (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  tier           text,
  required_stamps int not null default 0,
  partner_id     uuid,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.reward_redemptions (
  id          uuid primary key default gen_random_uuid(),
  reward_id   uuid not null references public.passport_rewards(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null,
  redeemed_at timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------ ride guide

create table public.ride_routes (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('jeep','tricycle_zone')),
  label          text not null,
  mode           text,
  fare_text      text,
  frequency_text text,
  note           text,
  sort           int not null default 0
);

create table public.ride_tips (
  id   uuid primary key default gen_random_uuid(),
  body text not null,
  sort int not null default 0
);

-- ---------------------------------------------------------------- public views

create view public.profiles_public
with (security_invoker = true) as
  select id, display_name, explorer_level from public.profiles;

-- ------------------------------------------------------------------- indexes

create index on public.events (status);
create index on public.events (season_key);
create index on public.event_schedule_items (event_id, sort);
create index on public.event_rsvps (user_id);
create index on public.tour_packages (status);
create index on public.tour_itinerary_stops (package_id, sort);
create index on public.tour_reservations (user_id);
create index on public.passport_scans (user_id);
create index on public.ride_routes (kind, sort);
