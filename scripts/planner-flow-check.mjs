import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.PLANNER_BASE_URL || "http://127.0.0.1:3000";
const outputDir = "/home/ubuntu/screenshots/planner-flow";
const cases = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const results = [];

for (const viewport of cases) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  let loginRedirectStarted = false;
  page.on("request", request => {
    if (request.url().includes("/app-auth")) loginRedirectStarted = true;
  });
  page.on("console", message => {
    if (message.type() === "error" && !message.text().includes("Please login (10001)") && !message.text().includes("401 (Unauthorized)")) consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/plan/new`, { waitUntil: "networkidle" });
  await page.getByText("STEP 1 · TRIP DETAILS").waitFor();
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-1.png`, fullPage: true });

  await page.getByRole("button", { name: "Next: Preferences" }).click();
  await page.getByText("STEP 2 · PREFERENCES").waitFor();
  await page.getByText("What are you interested in?").waitFor();
  await page.getByRole("button", { name: "Next: Review" }).waitFor();
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-2.png`, fullPage: true });

  await page.getByRole("button", { name: "Next: Review" }).click();
  await page.getByText("STEP 3 · FINAL REVIEW").waitFor();
  await page.getByText("Generate My Itinerary").waitFor();
  await page.getByText("Your Trip Summary").waitFor();
  await page.screenshot({ path: `${outputDir}/${viewport.name}-step-3.png`, fullPage: true });

  await page.getByRole("button", { name: /Generate My Itinerary/ }).click();
  await page.waitForTimeout(1500);
  results.push({ viewport: viewport.name, url: page.url(), loginRedirectStarted, consoleErrors });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ baseUrl, outputDir, results }, null, 2));
if (results.some(result => result.consoleErrors.length > 0)) process.exitCode = 1;
