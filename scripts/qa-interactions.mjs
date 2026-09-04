/**
 * Phase 12 interaction check. Re-navigates before each click so ElementHandles
 * never go stale, clicks every visible non-destructive control by index, and
 * records: errors, dead clicks (no nav / toast / modal / DOM change), and
 * overlays that fail to close on Escape. Also runs a focused overlay pass
 * (mobile menu, modals, drawers, filter toggles) at 390px and 1280px.
 *
 *   (pnpm dev on :5173)  node scripts/qa-interactions.mjs
 *   Output: screenshots/qa/interactions-report.json
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.BASE || "http://localhost:5173";
const out = "D:/El-Biyahe!/website 2/screenshots/qa";
await mkdir(out, { recursive: true });

const ROUTES = [
  ["home", "/"], ["events", "/events"], ["event-detail", "/events/likha-music-arts-festival"],
  ["tours", "/tours"], ["tour-detail", "/tours/makiling-explorer-tour"], ["passport", "/passport"],
  ["ride-guide", "/ride-guide"], ["delicacies", "/delicacies"], ["parking", "/parking"],
  ["stay-eat", "/stay-eat"], ["explore", "/explore"], ["dest-detail", "/explore/pagsanjan-falls"],
  ["account", "/account"],
];
const SKIP = /sign out|log ?out|delete|remove|reserve|rsvp|book/i;
const SEL = 'button:visible, a[href]:visible, [role="button"]:visible';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
{
  const p = await ctx.newPage();
  await p.goto(base + "/login");
  await p.fill('input[type="email"]', "elbi-tester@example.com");
  await p.fill('input[type="password"]', "test-elbi-123");
  await p.click('button[type="submit"]');
  await p.waitForURL(base + "/", { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1000);
  await p.close();
}

const findings = [];
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push(`${page.url().replace(base, "")} pageerror: ${e.message}`));
page.on("console", m => m.type() === "error" && errs.push(`${page.url().replace(base, "")} console: ${m.text().slice(0, 200)}`));

for (const [name, path] of ROUTES) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const n = (await page.$$(SEL)).length;
  let dead = 0, tested = 0;
  for (let i = 0; i < n; i++) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    const els = await page.$$(SEL);
    const el = els[i];
    if (!el) continue;
    const label = ((await el.textContent()) || (await el.getAttribute("aria-label")) || "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (SKIP.test(label)) continue;
    tested++;
    const beforeUrl = page.url();
    const beforeLen = (await page.content()).length;
    try { await el.click({ timeout: 1500 }); } catch { continue; }
    await page.waitForTimeout(300);
    const afterUrl = page.url();
    const toast = await page.$(".notice");
    const modal = await page.$(".modal-backdrop, .admin-drawer-backdrop, [role=dialog], .mobile-drawer");
    const afterLen = (await page.content()).length;
    if (afterUrl === beforeUrl && !toast && !modal && Math.abs(afterLen - beforeLen) < 15) {
      dead++;
      findings.push({ route: name, control: label || "(no label)", issue: "dead click — no nav/toast/modal/DOM change" });
    }
    if (modal) {
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(250);
      if (await page.$(".modal-backdrop, .admin-drawer-backdrop, [role=dialog], .mobile-drawer"))
        findings.push({ route: name, control: label, issue: "overlay did not close on Escape" });
    }
  }
  console.log(`  ${name}: ${n} controls, ${tested} tested, ${dead} dead`);
}

// focused overlay pass
for (const w of [390, 1280]) {
  await page.setViewportSize({ width: w, height: 850 });
  // mobile menu
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const mm = await page.$(".mobile-menu");
  if (w <= 700) {
    if (!mm) findings.push({ route: "home", control: "mobile menu", issue: `hamburger not visible at ${w}px` });
    else {
      await mm.click(); await page.waitForTimeout(300);
      const drawer = await page.$(".mobile-drawer, .mobile-drawer-backdrop");
      await page.screenshot({ path: `${out}/overlay__mobile-menu__${w}.png` });
      if (!drawer) findings.push({ route: "home", control: "mobile menu", issue: "drawer did not open" });
      else { await page.keyboard.press("Escape"); await page.waitForTimeout(250); }
    }
  }
  // explore filters toggle
  await page.goto(base + "/explore", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const fbtn = await page.$('button:has-text("Filters")');
  if (fbtn) { await fbtn.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/overlay__explore-filters__${w}.png` }); }
  // passport scan modal (logged in)
  await page.goto(base + "/passport", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const scanBtn = await page.$('button:has-text("Scan Passport")');
  if (scanBtn) {
    await scanBtn.click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/overlay__passport-scan__${w}.png` });
    const m = await page.$(".modal-backdrop, [role=dialog]");
    if (!m) findings.push({ route: "passport", control: "Scan Passport", issue: `scan modal did not open at ${w}px` });
    else { await page.keyboard.press("Escape"); await page.waitForTimeout(250);
      if (await page.$(".modal-backdrop, [role=dialog]")) findings.push({ route: "passport", control: "scan modal", issue: "did not close on Escape" }); }
  }
}

if (errs.length) findings.push({ route: "(any)", control: "(console)", issue: "console/pageerror during interaction pass", detail: [...new Set(errs)].slice(0, 20) });
await browser.close();
await writeFile(`${out}/interactions-report.json`, JSON.stringify(findings, null, 2));
console.log(`\n${findings.length} findings -> ${out}/interactions-report.json`);
