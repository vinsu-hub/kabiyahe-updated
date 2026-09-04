-- Row Level Security for ELBI.

-- ------------------------------------------------------------- enable RLS
alter table public.profiles            enable row level security;
alter table public.seasons             enable row level security;
alter table public.events              enable row level security;
alter table public.event_schedule_items enable row level security;
alter table public.event_updates       enable row level security;
alter table public.event_rsvps         enable row level security;
alter table public.tour_operators      enable row level security;
alter table public.tour_packages       enable row level security;
alter table public.tour_itinerary_stops enable row level security;
alter table public.tour_reviews        enable row level security;
alter table public.tour_reservations   enable row level security;
alter table public.referral_events     enable row level security;
alter table public.passport_locations  enable row level security;
alter table public.passport_scans      enable row level security;
alter table public.passport_rewards    enable row level security;
alter table public.reward_redemptions  enable row level security;
alter table public.ride_routes         enable row level security;
alter table public.ride_tips           enable row level security;

-- ------------------------------------------------------------- profiles
create policy "profiles: self or admin read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: self insert" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------- public content
-- Readable by everyone (anon + authenticated); writable only by admins.
do $$
declare t text;
begin
  foreach t in array array[
    'seasons','events','event_schedule_items','event_updates',
    'tour_operators','tour_packages','tour_itinerary_stops',
    'passport_rewards','ride_routes','ride_tips'
  ]
  loop
    execute format('create policy "%1$s: public read" on public.%1$s for select using (true);', t);
    execute format('create policy "%1$s: admin write" on public.%1$s for all using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- ------------------------------------------------------------- passport_locations
-- The scannable code lives here; clients read the code-free view instead.
create policy "passport_locations: admin read" on public.passport_locations
  for select using (public.is_admin());
create policy "passport_locations: admin write" on public.passport_locations
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- tour_reviews
create policy "tour_reviews: public read" on public.tour_reviews
  for select using (true);
create policy "tour_reviews: author insert" on public.tour_reviews
  for insert with check (user_id = auth.uid() or public.is_admin());
create policy "tour_reviews: admin manage" on public.tour_reviews
  for update using (public.is_admin());
create policy "tour_reviews: admin delete" on public.tour_reviews
  for delete using (public.is_admin());

-- ------------------------------------------------------------- per-user rows
do $$
declare t text;
begin
  foreach t in array array['event_rsvps','tour_reservations','passport_scans','reward_redemptions']
  loop
    execute format('create policy "%1$s: owner read" on public.%1$s for select using (user_id = auth.uid() or public.is_admin());', t);
    execute format('create policy "%1$s: owner insert" on public.%1$s for insert with check (user_id = auth.uid());', t);
    execute format('create policy "%1$s: owner delete" on public.%1$s for delete using (user_id = auth.uid());', t);
  end loop;
end $$;

-- reservations / redemptions may be advanced by admins
create policy "tour_reservations: admin update" on public.tour_reservations
  for update using (public.is_admin());
create policy "reward_redemptions: admin update" on public.reward_redemptions
  for update using (public.is_admin());

-- ------------------------------------------------------------- referral log
create policy "referral_events: anyone insert" on public.referral_events
  for insert with check (true);
create policy "referral_events: admin read" on public.referral_events
  for select using (public.is_admin());

-- ------------------------------------------------------------- grants for views
grant select on public.passport_locations_public to anon, authenticated;
grant select on public.profiles_public to anon, authenticated;
