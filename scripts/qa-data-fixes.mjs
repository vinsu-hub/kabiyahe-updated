/* Phase 11/12 QA — one-off live-data fixes that have no seed file.
   Run: node --env-file=.env.local scripts/qa-data-fixes.mjs */
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// #8 — accommodations had no booking_referral_url, so "Reserve" opened nothing.
// Point each at the venue's own Google listing (honest referral, always resolves).
const stays = [
  ["Trace Suites", "https://www.google.com/search?q=Trace+Suites+Los+Ba%C3%B1os+Laguna"],
  ["City of Springs", "https://www.google.com/search?q=City+of+Springs+Resort+Hotel+Los+Ba%C3%B1os"],
  ["Anest Tower", "https://www.google.com/search?q=Anest+Tower+Hotel+Los+Ba%C3%B1os+Laguna"],
];
for (const [name, url] of stays) {
  const { error } = await db.from("accommodations").update({ booking_referral_url: url }).eq("name", name);
  console.log(error ? `✗ ${name}: ${error.message}` : `✓ ${name} referral url set`);
}

// #23 — test-account display name shows in the admin sidebar.
const { data: ul } = await db.auth.admin.listUsers();
for (const email of ["elbi-tester@example.com", "elbi-plain@example.com"]) {
  const u = ul.users.find(x => x.email === email);
  if (!u) continue;
  const { error } = await db.from("profiles").update({ display_name: email === "elbi-tester@example.com" ? "El-Biyahe! Tester" : "El-Biyahe! Guest" }).eq("id", u.id);
  console.log(error ? `✗ ${email}: ${error.message}` : `✓ ${email} display_name updated`);
}
console.log("done");
