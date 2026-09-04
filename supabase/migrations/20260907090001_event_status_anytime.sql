-- Allow a self-guided / recurring "anytime" event status (Heritage Walk, Sunset at the Park).
alter table public.events drop constraint if exists events_status_check;
alter table public.events
  add constraint events_status_check
  check (status in ('live','today','week','season','recap','anytime'));
