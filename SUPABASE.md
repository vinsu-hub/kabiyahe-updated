# ELBI — Supabase backend

ELBI is a client-direct Supabase app: the React client talks to Supabase
(Postgres + Auth + Storage) directly, with Row-Level Security as the data-layer
guard. There is **no application server** — the old Kabiyahe Node/tRPC/Drizzle
stack is parked under `legacy/`.

## Local setup

1. `cp .env.example .env.local` and fill in the values from the Supabase
   dashboard → Project Settings:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — safe in the client bundle.
   - `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL` — **local scripts only**, never imported under `client/`.
2. `pnpm install`
3. `pnpm db:push` — applies `supabase/migrations/*` to the linked project
   (needs `SUPABASE_DB_URL` in the environment).
4. `pnpm db:seed` — loads the launch content (events, tours, passport spots,
   ride guide) from `scripts/seed.mjs`.
5. `pnpm dev` — Vite dev server on http://localhost:5173

## Auth

- **Email + password** and **guest browsing** work out of the box.
- **Google**: create a Google Cloud OAuth 2.0 client with redirect URI
  `https://<project>.supabase.co/auth/v1/callback`, then paste the client
  id/secret into Supabase → Authentication → Providers → Google. Add
  `http://localhost:5173/**` (and the prod URL) to Auth → URL Configuration →
  Redirect URLs.

## Admin access

A `profiles` row is auto-created on signup (`role = 'user'`). Promote yourself:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

`scripts/seed.mjs` also promotes `neilmedallon1@gmail.com` automatically once
that account has signed in. Admin UI lives at `/admin`.

## Schema

`supabase/migrations/`:
- `…_core.sql` — tables + `handle_new_user` / `guard_profile_role` triggers + `is_admin()`
- `…_functions.sql` — `scan_passport(qr, lat, lng)`: 150 m tolerance radius + 5-scans/60 s rate limit
- `…_rls.sql` — public content readable by all, writable by admin; per-user rows scoped to `auth.uid()`
- `…_storage.sql` — public `media` bucket, admin-write
- `…_public_views.sql` — `passport_locations_public` (no `qr_code`) + `profiles_public`
- `…_role_guard_fix.sql` — lets service-role bump roles

Hand-authored row types: `client/src/lib/supabase/types.ts` (keep in sync with the
migrations — CLI `gen types` needs Docker, which isn't set up here).

## Security note

If the secret key or DB password is ever exposed (e.g. pasted into a chat),
rotate it in Supabase → Project Settings → API / Database.
