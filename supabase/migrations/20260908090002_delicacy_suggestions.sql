-- Community "Add a Recommendation" capture — real submissions, admin-reviewed
-- (no dedicated admin UI yet; reviewed via Supabase Studio, see todo.md).
create table public.delicacy_suggestions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  place         text,
  note          text,
  submitted_by  uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.delicacy_suggestions enable row level security;
create policy "delicacy_suggestions: signed-in insert own" on public.delicacy_suggestions
  for insert with check (auth.uid() = submitted_by);
create policy "delicacy_suggestions: admin read" on public.delicacy_suggestions
  for select using (public.is_admin());
