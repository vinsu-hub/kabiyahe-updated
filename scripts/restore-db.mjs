/** Restore launch content, never user data. --dry-run performs no network calls. */
import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
if (existsSync(".env.local"))
  dotenv.config({ path: ".env.local", quiet: true });
const seeds = [
  "seed.mjs", // seasons → events; operators → packages → itinerary; passport + base catalogs
  "seed-destinations.mjs",
  "seed-delicacies.mjs", // replaces the legacy food catalog
  "seed-heritage-walk.mjs",
  "seed-parking.mjs", // supplements base parking
  "reseed-ride-guide.mjs", // final ride catalog
  "seed-geo.mjs", // backfills coordinates after all catalog writes
];
const required = [
  "VITE_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_DB_URL",
];
const redact = value => {
  let text = String(value);
  for (const name of required) {
    const secret = process.env[name];
    if (secret) text = text.split(secret).join(`<${name}>`);
  }
  return text.replace(/postgres(?:ql)?:\/\/[^\s"']+/g, "<database URL>");
};
const fail = message => {
  console.error(`Restore failed: ${redact(message)}`);
  process.exit(1);
};
const args = process.argv.slice(2);
const worker =
  args[0] === "--seed" && args.length === 2 && seeds.includes(args[1]);
if (!worker && args.some(arg => arg !== "--dry-run"))
  fail("Usage: pnpm db:restore [--dry-run]");
const dryRun = args.includes("--dry-run");
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length && !dryRun)
  fail(`Missing ${missing.join(", ")}. Export them or set them in .env.local.`);
if (missing.length)
  console.log(`Environment needed for execution: ${missing.join(", ")}`);
for (const [name, protocols] of [
  ["VITE_SUPABASE_URL", ["https:", "http:"]],
  ["SUPABASE_DB_URL", ["postgres:", "postgresql:"]],
]) {
  if (!process.env[name]) continue;
  try {
    if (!protocols.includes(new URL(process.env[name]).protocol))
      throw new Error();
  } catch {
    fail(`${name} must be a valid ${protocols.join(" or ")} URL.`);
  }
}

if (worker) {
  // Legacy scripts sometimes ignore SDK errors. Fail at the HTTP boundary even
  // for ignored deletes/lookups, rather than changing their standalone behavior.
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (...request) => {
    let response;
    try {
      response = await nativeFetch(...request);
    } catch {
      fail(
        `${args[1]}: Supabase request could not connect. Check project health and credentials.`
      );
    }
    if (!response.ok) {
      const body = await response.clone().text();
      fail(`${args[1]}: Supabase HTTP ${response.status}: ${body}`);
    }
    return response;
  };
  try {
    await import(new URL(args[1], import.meta.url));
  } catch (error) {
    fail(`${args[1]}: ${error.message}`);
  }
} else {
  const discovered = readdirSync("scripts").filter(name =>
    /^(seed.*|reseed-.*)\.mjs$/.test(name)
  );
  const unplanned = discovered.filter(name => !seeds.includes(name));
  if (unplanned.length)
    fail(`Add new seeds to the dependency plan: ${unplanned.join(", ")}`);
  for (const seed of seeds)
    if (!existsSync(path.join("scripts", seed)))
      fail(`Missing scripts/${seed}`);
  const migrations = readdirSync("supabase/migrations")
    .filter(name => name.endsWith(".sql"))
    .sort();
  console.log(
    `${dryRun ? "DRY RUN — no connections or writes\n" : ""}Restore plan:`
  );
  console.log("1. supabase db push --db-url <SUPABASE_DB_URL> --yes");
  migrations.forEach(name => console.log(`   ${name}`));
  seeds.forEach((name, i) => console.log(`${i + 2}. node scripts/${name}`));
  console.log(
    `${seeds.length + 2}. Print exact row counts for every public table (including empty user tables).`
  );
  if (!dryRun) {
    const run = (label, command, commandArgs) => {
      console.log(`\nRunning ${label}…`);
      const result = spawnSync(command, commandArgs, {
        cwd: root,
        env: process.env,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
      });
      if (result.stdout) console.log(redact(result.stdout).trimEnd());
      if (result.stderr) console.error(redact(result.stderr).trimEnd());
      if (result.error || result.status !== 0)
        fail(
          `${label}: ${result.error?.message ?? `exit ${result.status ?? result.signal}`}. Later steps were not run; correct the cause and rerun.`
        );
    };
    run("migrations", "supabase", [
      "db",
      "push",
      "--db-url",
      process.env.SUPABASE_DB_URL,
      "--yes",
    ]);
    for (const seed of seeds)
      run(seed, process.execPath, [
        fileURLToPath(import.meta.url),
        "--seed",
        seed,
      ]);
    const { default: pg } = await import("pg");
    const client = new pg.Client({
      connectionString: process.env.SUPABASE_DB_URL,
      connectionTimeoutMillis: 15000,
      statement_timeout: 30000,
    });
    try {
      await client.connect();
      const { rows } = await client.query(
        "select tablename from pg_catalog.pg_tables where schemaname = 'public' order by tablename"
      );
      console.log("\nPublic table row counts:");
      for (const { tablename } of rows) {
        const identifier = `"${tablename.replaceAll('"', '""')}"`;
        const result = await client.query(
          `select count(*)::text as count from public.${identifier}`
        );
        console.log(`  ${tablename}: ${result.rows[0].count}`);
      }
    } catch (error) {
      fail(`row counts: ${error.message}`);
    } finally {
      await client.end();
    }
    console.log("\nRestore complete.");
  }
}
