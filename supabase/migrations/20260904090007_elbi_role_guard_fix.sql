-- The role guard must not block service-role / SQL-editor writes (auth.uid() is
-- null there). Only clamp the role when a real, non-admin end user is editing.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
