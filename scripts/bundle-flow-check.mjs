import { chromium } from "playwright";

const baseUrl = process.env.BUNDLE_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const results = [];

for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => consoleErrors.push(error.message));
  await page.goto(`${baseUrl}/bundles`, { waitUntil: "networkidle" });
  await page.getByText("Ready-made trips.").waitFor();
  await page.getByRole("button", { name: "Nature" }).last().click();
  await page.getByText(/routes available/).waitFor();
  const filteredCount = await page.locator(".bundle-grid .bundle-card").count();
  await page.getByRole("button", { name: "All" }).last().click();
  const resetCount = await page.locator(".bundle-grid .bundle-card").count();
  await page.getByRole("link", { name: /View featured trip/ }).click();
  const featuredPath = new URL(page.url()).pathname;
  results.push({ viewport: viewport.name, filteredCount, resetCount, featuredPath, consoleErrors });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ baseUrl, results }, null, 2));
if (results.some(result => result.filteredCount < 2 || result.resetCount !== 5 || result.featuredPath !== "/bundles/laguna-weekend-escape" || result.consoleErrors.length > 0)) process.exitCode = 1;
