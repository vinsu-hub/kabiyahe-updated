alter table public.parking_spots add column if not exists category text;
alter table public.parking_spots add column if not exists access_type text;
alter table public.parking_spots add column if not exists verified text not null default 'community_reported'
  check (verified in ('verified','community_reported'));

update public.parking_spots set access_type = 'Public' where slug in ('municipal-hall-parking','uplb-main-gate-area');
update public.parking_spots set access_type = 'Public / market' where slug = 'public-market-parking';
update public.parking_spots set category = 'institutional' where slug in ('municipal-hall-parking','uplb-main-gate-area');
update public.parking_spots set category = 'market' where slug = 'public-market-parking';
