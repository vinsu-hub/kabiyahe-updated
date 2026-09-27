# Restore the El-Biyahe! database

This restores the repository's schema and launch catalogs. It does **not** recover a lost project's users, RSVP history, passport progress, uploaded media, or other production records. No production connection was used to validate this procedure.

## A. Resume a paused project

1. Open the Supabase dashboard in the organization that owns the existing project. Confirm its project reference and status; a DNS failure alone does not prove that it is paused.
2. If the dashboard offers **Restore/Resume**, use it and wait until the database and API are healthy. If the project cannot be resumed, follow the dashboard's backup/export recovery instructions or contact Supabase support; use section B for a new launch-content project.
3. Verify the existing tables and data in Table Editor before changing anything. A resumed project normally retains its database; do not reseed it just to resume service.
4. Confirm the project URL and publishable key against Vercel's existing values. If they changed, follow section B's deployment steps. Verify the deployed data sections and sign-in.
5. If launch content is actually missing, take a backup before considering `pnpm db:restore`. Read the replacement behavior below first: this command is intended for a fresh project, and deletes some user-linked records on repeat runs.

## B. Create a fresh project and restore launch content

1. Create a Supabase project in the intended organization and region. Save its database password securely and wait for provisioning. Use a new project reference, rather than the unavailable production reference.
2. Install Node.js 22 or newer, the repository's pnpm version, and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). Confirm `supabase --version`, then run `pnpm install` from the repository root.
3. In the new project's **Connect** dialog and API settings, obtain the project URL, server secret key (or legacy service-role key), publishable key, and Postgres connection string. Use a direct database connection or session pooler connection supported by your network. URL-encode special characters in the database password. All credentials must belong to the same new project.
4. Create an untracked `.env.local` locally, or export these variables in your shell. The runner loads `.env.local` automatically; existing shell variables take precedence.

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
   SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
   SUPABASE_DB_URL=postgresql://postgres:URL_ENCODED_PASSWORD@db.YOUR_NEW_PROJECT_REF.supabase.co:5432/postgres
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
   ```

   The restore requires the first three variables. The fourth is for the web build. Keep the server secret and database URL out of Vite variables and browser builds.

5. Preview the complete plan without connecting to anything:

   ```sh
   pnpm db:restore --dry-run
   ```

   This works without credentials and reports missing variables; if supplied, URL syntax is checked. It does not check DNS, authorization, CLI availability, migration validity, or data correctness against a database.

6. When ready to write to the new project, run:

   ```sh
   pnpm db:restore
   ```

   [Database push](https://supabase.com/docs/reference/cli/supabase-db-push) applies pending migrations from `supabase/migrations` in filename order using the explicit database URL. No CLI project link is needed. The runner stops at the first failed migration, seed request, or count query and reports the failing step. Correct the cause and rerun; successful migration history is retained.

7. Review the final exact row counts for every public table. User tables may correctly be empty. Check Table Editor and the app's catalogs. If a seed fails with table permission errors, inspect schema grants: the existing migrations explicitly grant views, but rely on project defaults for table grants. Configure the required table access under the existing RLS policies; do not disable RLS to bypass the error.
8. Reconfigure Auth Site URL and redirect URLs for the deployed site, plus any required OAuth providers, SMTP, and uploaded media. Database push does not apply remote Auth configuration from `supabase/config.toml`. The seed does not create users; its existing admin bootstrap only promotes its configured account if that account already exists. Manage administrator access deliberately in the dashboard.
9. In Vercel, open the application's **Settings → Environment Variables**. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the new project's matching values for Production and any intended Preview/Development environments. Neither `SUPABASE_SECRET_KEY` nor `SUPABASE_DB_URL` is needed by the static frontend.
10. Redeploy the application with the updated variables, then verify catalogs, events, maps, and sign-in. Vite embeds these public values at build time; updating variables alone does not update an existing deployment. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Seed order and repeat behavior

| Order | Script                   | Purpose                                                                                                          |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 1     | `seed.mjs`               | Seasons before events; operators before packages and children; passport missions, rewards, and base ride content |
| 2     | `seed-destinations.mjs`  | Upsert destination catalog by slug                                                                               |
| 3     | `seed-delicacies.mjs`    | Replace food catalog                                                                                             |
| 4     | `seed-heritage-walk.mjs` | Replace heritage trail stops                                                                                     |
| 5     | `seed-parking.mjs`       | Upsert additional parking rows                                                                                   |
| 6     | `reseed-ride-guide.mjs`  | Replace ride routes and tips with the final catalog                                                              |
| 7     | `seed-geo.mjs`           | Backfill coordinates after catalog and itinerary writes                                                          |

Running the command again converges on the seeded catalog without duplicate rows. Some scripts delete and reinsert rows, so generated IDs and timestamps can change. It is not a transactional backup restore: failures can leave partial content. The main seed replaces schedules, updates, itinerary stops, reviews, rewards and missions; it clears reward redemptions and mission completions and removes stale events and their RSVPs. Back up an existing populated database first. The main seed currently provides no accommodations or base parking rows, so accommodations remain empty in a fresh project and parking comes from `seed-parking.mjs`; the geo backfill does not create missing rows.

The runner executes each seed in an isolated process and catches HTTP/network failures even where standalone legacy scripts ignore SDK errors. Newly added seed files require an explicit dependency-order entry before restore can run.

## Season content audit

Season names keep the El-Biyahe! brand prefix (El-Biyahe! Bañada, Sol Open, Sibol Weekend Market, Makiling Enchanted). That is the deliberate rebrand from the old ELBi G! name, not a mismatch with the brief. All four pillar triplets already matched the brief; no changes were needed.

The existing Q1 → Q4 order follows the supplied season listing. The supplied summary does not explicitly establish quarter dates: the Q4 season's seeded September–December span and September lead-in overlap Q3, and its current-season flag is fixed. These are ambiguous and remain unchanged pending client confirmation. Existing blurbs paraphrase the positioning; the seed has no global tagline field. No confidential brief passages were copied into this repository.
