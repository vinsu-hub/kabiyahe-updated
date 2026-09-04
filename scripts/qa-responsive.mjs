/**
 * Phase 11 responsive + error sweep. Visits every route at every breakpoint,
 * captures a viewport screenshot, and records horizontal-scroll overflow,
 * pageerrors, console errors, and responses >= 400.
 *
 *   (pnpm dev running on :5173)  node scripts/qa-responsive.mjs
 *
 * Output: screenshots/qa/<route>__<width>.png  +  screenshots/qa/responsive-report.json
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.BASE || "http://localhost:5173";
const out = "D:/El-Biyahe!/website 2/screenshots/qa";
await mkdir(out, { recursive: true });

const WIDTHS = [375, 414, 768, 900, 1024, 1280, 1440];
const PUBLIC = [
  ["home", "/"], ["events", "/events"], ["event-detail", "/events/likha-music-arts-festival"],
  ["tours", "/tours"], ["tour-detail", "/tours/makiling-explorer-tour"],
  ["passport", "/passport"], ["ride-guide", "/ride-guide"], ["delicacies", "/delicacies"],
  ["parking", "/parking"], ["stay-eat", "/stay-eat"], ["explore", "/explore"],
  ["dest-detail", "/explore/pagsanjan-falls"], ["account", "/account"], ["saved", "/saved"],
  ["login", "/login"], ["signup", "/signup"], ["notfound", "/no-such-page"],
];
const ADMIN = [
  ["admin", "/admin"], ["admin-events", "/admin/events"], ["admin-tours", "/admin/tours"],
  ["admin-passport", "/admin/passport"], ["admin-delicacies", "/admin/delicacies"],
  ["admin-accommodations", "/admin/accommodations"], ["admin-parking", "/admin/parking"],
  ["admin-destinations", "/admin/destinations"],
];
const LOGGED_IN_ROUTES = new Set(["account", "saved", "passport", ...ADMIN.map(a => a[0])]);

const browser = await chromium.launch();
const findings = [];

async function login(context) {
  const page = await context.newPage();
  await page.goto(base + "/login");
  await page.fill('input[type="email"]', process.env.QA_EMAIL || "elbi-tester@example.com");
  await page.fill('input[type="password"]', process.env.QA_PASS || "test-elbi-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(base + "/", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.close();
}

async function sweep(context, routes, widths, tag) {
  for (const [name, path] of routes) {
    for (const w of widths) {
      const page = await context.newPage();
      await page.setViewportSize({ width: w, height: 900 });
      const errs = [];
      page.on("pageerror", e => errs.push("pageerror: " + e.message));
      page.on("console", m => m.type() === "error" && errs.push("console: " + m.text().slice(0, 300)));
      page.on("response", r => { if (r.status() >= 400) errs.push(`http ${r.status()} ${r.url().replace(base, "")}`); });
      try {
        await page.goto(base + path, { waitUntil: "networkidle", timeout: 20000 });
      } catch (e) { errs.push("goto: " + e.message); }
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth - de.clientWidth > 1
          ? { by: de.scrollWidth - de.clientWidth,
              culprits: [...document.querySelectorAll("body *")]
                .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
                .slice(0, 5)
                .map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ").filter(Boolean).slice(0, 2).join(".") : "")) }
          : null;
      });
      const file = `${tag}__${name}__${w}.png`;
      await page.screenshot({ path: `${out}/${file}` });
      if (overflow || errs.length) {
        findings.push({ route: name, path, width: w, file, overflow, errors: [...new Set(errs)] });
        console.log(`  ⚠ ${name} @${w}  ${overflow ? `overflow +${overflow.by}px [${overflow.culprits.join(", ")}]` : ""}  ${errs.length ? errs.length + " err" : ""}`);
      } else {
        console.log(`  ✓ ${name} @${w}`);
      }
      await page.close();
    }
  }
}

// logged-out public sweep
const anon = await browser.newContext({ reducedMotion: "reduce" });
await sweep(anon, PUBLIC.filter(r => !LOGGED_IN_ROUTES.has(r[0])), WIDTHS, "anon");
// also hit the logged-in routes anonymously to confirm the redirect/guard renders cleanly
await sweep(anon, PUBLIC.filter(r => LOGGED_IN_ROUTES.has(r[0])), [375, 1280], "anon-guard");
await anon.close();

// logged-in sweep
const authed = await browser.newContext({ reducedMotion: "reduce" });
await login(authed);
await sweep(authed, PUBLIC.filter(r => ["account", "saved", "passport"].includes(r[0])), WIDTHS, "auth");
await sweep(authed, ADMIN, [820, 1280, 1440], "auth");
await authed.close();

await browser.close();
await writeFile(`${out}/responsive-report.json`, JSON.stringify(findings, null, 2));
console.log(`\n${findings.length} routes with findings. Details: ${out}/responsive-report.json`);
