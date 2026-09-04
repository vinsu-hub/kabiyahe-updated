import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", e => errs.push(String(e)));
for (const [path, needle] of [["/events","Anytime in Los Baños"],["/heritage-walk","Heritage Walk"],["/explore","In Los Baños"]]) {
  await p.goto("http://localhost:5173" + path, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const txt = await p.textContent("body");
  console.log(`${path.padEnd(16)} ${txt.includes(needle) ? "OK" : "MISS: " + needle}`);
}
await p.goto("http://localhost:5173/heritage-walk", { waitUntil: "load" });
await p.waitForTimeout(3500);
const markers = await p.locator(".lbmap-pin").count();
console.log(`heritage-walk markers: ${markers}`);
console.log(`console errors: ${errs.length}`);
errs.slice(0,8).forEach(e => console.log("  ! " + e));
await b.close();
