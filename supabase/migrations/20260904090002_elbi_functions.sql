-- Passport scan: tolerance-radius + rate-limited stamp collection.
-- Called from the client as supabase.rpc('scan_passport', {...}).

create or replace function public.haversine_m(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

create or replace function public.scan_passport(
  p_qr  text,
  p_lat double precision default null,
  p_lng double precision default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_loc       public.passport_locations%rowtype;
  v_recent    int;
  v_distance  double precision;
  v_inserted  boolean := false;
  v_count     int;
  v_tolerance constant double precision := 150;   -- metres
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'auth', 'message', 'Sign in to collect stamps.');
  end if;

  select * into v_loc from public.passport_locations
  where upper(qr_code) = upper(trim(p_qr)) and active;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found', 'message', 'That code is not a valid ELBI Passport QR.');
  end if;

  select count(*) into v_recent from public.passport_scans
  where user_id = v_uid and scanned_at > now() - interval '60 seconds';
  if v_recent >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited', 'message', 'Too many scans just now — try again in a minute.');
  end if;

  if p_lat is not null and p_lng is not null and v_loc.lat is not null and v_loc.lng is not null then
    v_distance := public.haversine_m(p_lat, p_lng, v_loc.lat, v_loc.lng);
    if v_distance > v_tolerance then
      return jsonb_build_object('ok', false, 'reason', 'too_far',
        'message', 'You need to be at ' || v_loc.name || ' to collect this stamp.',
        'distance_m', round(v_distance));
    end if;
  end if;

  insert into public.passport_scans (location_id, user_id)
  values (v_loc.id, v_uid)
  on conflict (location_id, user_id) do nothing;
  get diagnostics v_count = row_count;
  v_inserted := v_count > 0;

  if not v_inserted then
    return jsonb_build_object('ok', false, 'reason', 'already', 'message', 'You have already collected this stamp.');
  end if;

  update public.profiles set xp = xp + 25, updated_at = now() where id = v_uid;

  select count(*) into v_count from public.passport_scans where user_id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'name', v_loc.name,
    'category', v_loc.category,
    'stamps_collected', v_count
  );
end;
$$;

revoke all on function public.scan_passport(text, double precision, double precision) from public;
grant execute on function public.scan_passport(text, double precision, double precision) to authenticated;
