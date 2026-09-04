/* Phase 12 admin CRUD smoke — one representative create/edit/delete via the real
   admin UI, plus an RLS check that a non-admin cannot write.
   (pnpm dev on :5173)  node --env-file=.env.local scripts/qa-admin-crud.mjs */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const base = "http://localhost:5173";
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
await db.from("delicacies").delete().eq("slug", "qa-delete-me");

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errs = [];
p.on("pageerror", e => errs.push("pageerror " + e.message));
p.on("console", m => m.type() === "error" && errs.push("console " + m.text().slice(0, 160)));

await p.goto(base + "/login");
await p.fill('input[type="email"]', "elbi-tester@example.com");
await p.fill('input[type="password"]', "test-elbi-123");
await p.click('button[type="submit"]');
await p.waitForURL(base + "/", { timeout: 15000 }).catch(() => {});
await p.goto(base + "/admin/delicacies", { waitUntil: "networkidle" });
await p.waitForTimeout(600);

// CREATE
await p.click('button:has-text("New delicacy")');
await p.waitForTimeout(400);
const setField = async (label, val) => {
  const el = p.locator(`.admin-field:has(span:text-is("${label}")) input, .admin-field:has(span:text-is("${label}")) textarea`).first();
  if (await el.count()) { await el.fill(val); return true; }
  return false;
};
await setField("Name", "QA Delete Me");
await setField("Category", "Market Finds");
await setField("Place", "QA test row");
await setField("Description", "Temporary row created by qa-admin-crud.mjs");
await p.click('.admin-drawer-foot button:has-text("Save")');
await p.waitForTimeout(1500);
let row = await db.from("delicacies").select("slug,name,place").eq("slug", "qa-delete-me").maybeSingle();
console.log(row.data ? `PASS create -> ${JSON.stringify(row.data)}` : `FAIL create (no row; error: ${row.error?.message})`);

// EDIT
if (row.data) {
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  await p.click('td:has-text("QA Delete Me"), .admin-row-link:has-text("QA Delete Me"), a:has-text("QA Delete Me")').catch(() => {});
  await p.waitForTimeout(500);
  const placeEl = p.locator('.admin-field:has(span:text-is("Place")) input').first();
  if (await placeEl.count()) {
    await placeEl.fill("QA test row (edited)");
    await p.click('.admin-drawer-foot button:has-text("Save")');
    await p.waitForTimeout(1500);
  }
  row = await db.from("delicacies").select("place").eq("slug", "qa-delete-me").maybeSingle();
  console.log(row.data?.place === "QA test row (edited)" ? "PASS edit" : `WARN edit not confirmed (place=${row.data?.place})`);
}

// DELETE via UI
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(500);
p.on("dialog", d => d.accept());
const delBtn = p.locator('tr:has-text("QA Delete Me") button, .admin-row:has-text("QA Delete Me") button').last();
if (await delBtn.count()) { await delBtn.click(); await p.waitForTimeout(1500); }
row = await db.from("delicacies").select("slug").eq("slug", "qa-delete-me").maybeSingle();
console.log(!row.data ? "PASS delete" : "WARN delete not confirmed (row still present)");
await db.from("delicacies").delete().eq("slug", "qa-delete-me"); // cleanup regardless

// RLS: non-admin cannot write
const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
await anon.auth.signInWithPassword({ email: "elbi-plain@example.com", password: "test-elbi-123" }).catch(() => {});
const ins = await anon.from("delicacies").insert({ slug: "qa-rls-x", name: "x", category: "x", place: "x", description: "x", price_tier: 1, tags: [] });
console.log(ins.error ? `PASS RLS blocks non-admin write (${ins.error.message.slice(0, 60)})` : "FAIL RLS did NOT block non-admin write");
await db.from("delicacies").delete().eq("slug", "qa-rls-x");

await b.close();
console.log(errs.length ? "\nERRORS:\n" + [...new Set(errs)].join("\n") : "\nno console errors");
