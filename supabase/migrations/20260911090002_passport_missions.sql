-- Passport Missions: a short, curated task list layered on top of the stamp catalog.
-- Progress is always computed live from passport_scans/event_rsvps; mission_completions
-- exists purely as a ledger so XP is awarded exactly once per mission per user.

create table public.passport_missions (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  description   text,
  metric        text not null check (metric in ('category_scans','total_scans','event_rsvps')),
  category      text,
  target_count  int not null,
  xp_reward     int not null default 0,
  active        boolean not null default true,
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);

create table public.mission_completions (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references public.passport_missions(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  unique (mission_id, user_id)
);

alter table public.passport_missions   enable row level security;
alter table public.mission_completions enable row level security;

create policy "passport_missions: public read" on public.passport_missions
  for select using (active);
create policy "passport_missions: admin write" on public.passport_missions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "mission_completions: owner read" on public.mission_completions
  for select using (user_id = auth.uid() or public.is_admin());
create policy "mission_completions: owner insert" on public.mission_completions
  for insert with check (user_id = auth.uid());

-- Recomputes mission progress server-side (same 3 metrics the client derives) and awards
-- XP exactly once via public.award_passport_xp (see 20260911090002_passport_leveling.sql).
create or replace function public.claim_mission(p_mission_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_mission  public.passport_missions%rowtype;
  v_progress int;
  v_count    int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'auth', 'message', 'Sign in to claim missions.');
  end if;

  select * into v_mission from public.passport_missions
  where id = p_mission_id and active;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found', 'message', 'That mission is not available.');
  end if;

  if v_mission.metric = 'category_scans' then
    select count(*) into v_progress from public.passport_scans ps
    join public.passport_locations pl on pl.id = ps.location_id
    where ps.user_id = v_uid and pl.category = v_mission.category;
  elsif v_mission.metric = 'total_scans' then
    select count(*) into v_progress from public.passport_scans where user_id = v_uid;
  else
    select count(*) into v_progress from public.event_rsvps where user_id = v_uid;
  end if;

  if v_progress < v_mission.target_count then
    return jsonb_build_object('ok', false, 'reason', 'incomplete', 'progress', v_progress, 'target', v_mission.target_count);
  end if;

  insert into public.mission_completions (mission_id, user_id)
  values (v_mission.id, v_uid)
  on conflict (mission_id, user_id) do nothing;
  get diagnostics v_count = row_count;

  if v_count = 0 then
    return jsonb_build_object('ok', false, 'reason', 'already', 'message', 'You already claimed this mission.');
  end if;

  perform public.award_passport_xp(v_uid, v_mission.xp_reward);

  return jsonb_build_object('ok', true, 'xp_awarded', v_mission.xp_reward);
end;
$$;

revoke all on function public.claim_mission(uuid) from public;
grant execute on function public.claim_mission(uuid) to authenticated;
