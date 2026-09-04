/**
 * Phase 12 write-flow smoke. Signs in as the tester in a real browser, exercises
 * every data-write flow, then checks the resulting Supabase rows with the service
 * key. Resets the tester's rows before and after so it is repeatable.
 *
 *   (pnpm dev on :5173)  node --env-file=.env.local scripts/qa-writeflows.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const base = "http://localhost:5173";
const out = "D:/El-Biyahe!/website 2/screenshots/qa";
await mkdir(out, { recursive: true });
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const { data: ul } = await db.auth.admin.listUsers();
const tester = ul.users.find(u => u.email === "elbi-tester@example.com");
const reset = async () => {
  for (const t of ["event_rsvps", "passport_scans", "referral_events", "tour_reservations"])
    await db.from(t).delete().eq("user_id", tester.id);
};
await reset();
const results = [];
const rec = (flow, ok, detail) => { results.push({ flow, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${flow}  ${detail ?? ""}`); };

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" })).newPage();
const errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message));
page.on("console", m => m.type() === "error" && errs.push("console: " + m.text().slice(0, 200)));

// sign in
await page.goto(base + "/login");
await page.fill('input[type="email"]', "elbi-tester@example.com");
await page.fill('input[type="password"]', "test-elbi-123");
await page.click('button[type="submit"]');
await page.waitForURL(base + "/", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
rec("sign in", page.url() === base + "/", page.url());

// RSVP on + off
await page.goto(base + "/events/banamos-festival-2026", { waitUntil: "load" });
await page.waitForSelector(".elbiyahe-rsvp", { timeout: 15000 });
await page.click(".elbiyahe-rsvp"); await page.waitForTimeout(1500);
let r = await db.from("event_rsvps").select("*").eq("user_id", tester.id);
rec("event RSVP on", (r.data?.length ?? 0) === 1, `${r.data?.length} row(s)`);
await page.click(".elbiyahe-rsvp"); await page.waitForTimeout(1500);
r = await db.from("event_rsvps").select("*").eq("user_id", tester.id);
rec("event RSVP off", (r.data?.length ?? 0) === 0, `${r.data?.length} row(s)`);

// tour reserve
await page.goto(base + "/tours/makiling-explorer-tour", { waitUntil: "load" });
await page.waitForSelector('button:has-text("Reserve")', { timeout: 15000 }).catch(() => {});
const tbtn = await page.$('button:has-text("Reserve"), button:has-text("reserve")');
if (tbtn) {
  await tbtn.click(); await page.waitForTimeout(1800);
  const tr = await db.from("tour_reservations").select("*").eq("user_id", tester.id);
  const re = await db.from("referral_events").select("*").eq("user_id", tester.id).eq("type", "tour_reservation");
  rec("tour reserve", (tr.data?.length ?? 0) === 1 && (re.data?.length ?? 0) === 1, `res:${tr.data?.length} referral:${re.data?.length}`);
  await page.screenshot({ path: `${out}/writeflow__tour-reserve.png` });
} else rec("tour reserve", false, "reserve button not found");

// accommodation reserve
await page.goto(base + "/stay-eat", { waitUntil: "load" });
await page.waitForTimeout(600);
const abtn = await page.$('button:has-text("Reserve")');
if (abtn) {
  await abtn.click(); await page.waitForTimeout(1800);
  const re = await db.from("referral_events").select("*").eq("user_id", tester.id).eq("type", "accommodation_booking");
  rec("accommodation reserve", (re.data?.length ?? 0) >= 1, `referral:${re.data?.length}`);
  await page.screenshot({ path: `${out}/writeflow__accom-reserve.png` });
} else rec("accommodation reserve", false, "reserve button not found");

// passport scan — valid then invalid
await page.goto(base + "/passport", { waitUntil: "load" });
await page.click('button:has-text("Scan Passport")'); await page.waitForTimeout(500);
await page.fill(".modal input, [role=dialog] input", "ELBIYAHE-MUSEUM");
await page.click(".modal .btn, [role=dialog] .btn"); await page.waitForTimeout(2500);
let ps = await db.from("passport_scans").select("*").eq("user_id", tester.id);
rec("passport scan (valid)", (ps.data?.length ?? 0) === 1, `${ps.data?.length} scan(s)`);
await page.screenshot({ path: `${out}/writeflow__passport-scan.png` });
// invalid
await page.goto(base + "/passport", { waitUntil: "load" });
await page.click('button:has-text("Scan Passport")'); await page.waitForTimeout(500);
await page.fill(".modal input, [role=dialog] input", "NOT-A-REAL-CODE");
await page.click(".modal .btn, [role=dialog] .btn"); await page.waitForTimeout(2000);
ps = await db.from("passport_scans").select("*").eq("user_id", tester.id);
const toast = await page.$(".notice");
rec("passport scan (invalid rejected)", (ps.data?.length ?? 0) === 1 && !!toast, `${ps.data?.length} scan(s), toast:${!!toast}`);

// RLS: anonymous cannot write
const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const anonIns = await anon.from("event_rsvps").insert({ event_id: "00000000-0000-0000-0000-000000000000", user_id: tester.id });
rec("RLS blocks anon RSVP insert", !!anonIns.error, anonIns.error?.message?.slice(0, 80) ?? "NO ERROR (bad)");

await browser.close();
await reset();
console.log("\n" + (errs.length ? "CONSOLE ERRORS:\n" + [...new Set(errs)].join("\n") : "no console errors"));
console.log(`\n${results.filter(r => !r.ok).length} FAIL / ${results.length} checks`);
