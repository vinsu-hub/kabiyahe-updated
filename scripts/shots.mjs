import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const out = "D:/El-Biyahe!/website 2/screenshots";
await mkdir(out, { recursive: true });
const base = process.env.BASE || "http://localhost:5173";
const pages = [
  ["home", "/"],
  ["events", "/events"],
  ["event-detail", "/events/uplb-feb-fair-2025"],
  ["tours", "/tours"],
  ["tour-detail", "/tours/makiling-explorer-tour"],
  ["passport", "/passport"],
  ["ride-guide", "/ride-guide"],
  ["login", "/login"],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => m.type() === "error" && errors.push("console: " + m.text()));
page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
for (const [name, path] of pages) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log("shot", name);
}
await browser.close();
console.log(errors.length ? "\nERRORS:\n" + [...new Set(errors)].join("\n") : "\nno errors");
