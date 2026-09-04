-- Delicacies: real Los Baños food and where to find it.

create table public.delicacies (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  category     text not null check (category in ('Local Favorites','Street Food','Baked Goods','Dairy & Desserts','Market Finds')),
  place        text,
  barangay     text,
  lat          double precision,
  lng          double precision,
  description  text,
  hero_image   text,
  price_tier   int not null default 1,
  rating       numeric(2,1),
  review_count int not null default 0,
  tags         text[] not null default '{}',
  source_url   text,
  featured     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on public.delicacies (category);

alter table public.delicacies enable row level security;
create policy "delicacies: public read" on public.delicacies for select using (true);
create policy "delicacies: admin write" on public.delicacies for all using (public.is_admin()) with check (public.is_admin());
