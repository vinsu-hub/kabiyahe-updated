import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const out = "D:/El-Biyahe!/website 2/screenshots";
await mkdir(out, { recursive: true });
const base = "http://localhost:5173";

// reset the tester's per-user rows so the run is repeatable
const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const { data: ul } = await admin.auth.admin.listUsers();
const tester = ul.users.find(u => u.email === "elbi-tester@example.com");
await admin.from("event_rsvps").delete().eq("user_id", tester.id);
await admin.from("passport_scans").delete().eq("user_id", tester.id);
console.log("reset tester rows");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const log = [];
page.on("pageerror", e => log.push("pageerror: " + e.message));
page.on("console", m => m.type() === "error" && log.push("console: " + m.text()));

// 1. sign in
await page.goto(base + "/login");
await page.fill('input[type="email"]', "elbi-tester@example.com");
await page.fill('input[type="password"]', "test-elbi-123");
await page.click('button[type="submit"]');
await page.waitForURL(base + "/", { timeout: 10000 });
await page.waitForTimeout(1500);
console.log("signed in, header shows:", await page.locator(".avatar, .header-actions .btn").first().textContent().catch(() => "?"));

// 2. RSVP an event
await page.goto(base + "/events/likha-music-arts-festival");
await page.waitForSelector(".elbi-rsvp");
await page.click(".elbi-rsvp");
await page.waitForTimeout(1200);
console.log("RSVP button now:", (await page.locator(".elbi-rsvp").textContent()).trim());
await page.screenshot({ path: `${out}/e2e-event-rsvp.png`, fullPage: true });

// 3. passport scan
await page.goto(base + "/passport");
await page.waitForSelector(".elbi-scan-btn");
await page.click(".elbi-scan-btn");
await page.waitForSelector(".modal input");
await page.fill(".modal input", "ELBI-MUSEUM");
await page.click(".modal .btn");
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/e2e-passport-scanned.png`, fullPage: true });
const success = await page.locator(".elbi-stamp-success").count();
console.log("passport stamp success block:", success > 0 ? "shown" : "NOT shown");

// 4. admin
await page.goto(base + "/admin");
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/e2e-admin.png`, fullPage: true });
console.log("admin dashboard heading:", await page.locator("h1").first().textContent().catch(() => "?"));
await page.goto(base + "/admin/events");
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/e2e-admin-events.png`, fullPage: true });
console.log("admin events rows:", await page.locator(".admin-table tbody tr").count());

await browser.close();
console.log(log.length ? "\nERRORS:\n" + [...new Set(log)].join("\n") : "\nno console errors");
