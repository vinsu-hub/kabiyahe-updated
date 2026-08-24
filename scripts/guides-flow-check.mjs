import { chromium } from "playwright";

const executablePath = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const results = [];

for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/guides`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Find a local guide." }).waitFor();
  const initialCount = await page.getByRole("heading", { name: /guide profiles/ }).textContent();

  await page.locator("label").filter({ hasText: "Place" }).locator("select").selectOption({ label: "Pagsanjan Falls" });
  await page.getByRole("heading", { name: "1 guide profile" }).waitFor();
  const placeResult = await page.getByRole("heading", { name: "Ate Liza" }).count();

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("heading", { name: "4 guide profiles" }).waitFor();

  await page.getByPlaceholder("Search guide or place...").fill("Ate Liza");
  await page.getByRole("heading", { name: "1 guide profile" }).waitFor();
  const searchResult = await page.getByRole("heading", { name: "Ate Liza" }).count();
  await page.getByRole("button", { name: "Clear filters" }).click();

  await page.getByRole("link", { name: "View guide" }).first().click();
  await page.getByRole("heading", { name: "Kuya Ramon" }).waitFor();
  const disclaimer = await page.getByText("Kabiyahe does not process guide bookings or payments.").count();
  const contactUnavailable = await page.getByText(/No direct contact channel is published/).count();
  await page.getByRole("link", { name: "More guides nearby" }).click();
  await page.getByRole("heading", { name: /guide profile/ }).waitFor();

  results.push({ label, initialCount, placeResult, searchResult, disclaimer, contactUnavailable, consoleErrors });
  await browser.close();
}

const itineraryBrowser = await chromium.launch({ headless: true, executablePath });
const itineraryPage = await itineraryBrowser.newPage({ viewport: { width: 1280, height: 900 } });
const itineraryErrors = [];
itineraryPage.on("console", message => { if (message.type() === "error") itineraryErrors.push(message.text()); });
await itineraryPage.goto(`${baseUrl}/trips/laguna-weekend`, { waitUntil: "networkidle" });
const contextualGuides = await itineraryPage.getByRole("link", { name: "Find a guide" }).count();
results.push({ itineraryContextualGuides: contextualGuides, itineraryErrors });
await itineraryBrowser.close();

console.log(JSON.stringify({ baseUrl, results }, null, 2));
if (results.slice(0, 2).some(result => result.placeResult !== 1 || result.searchResult !== 1 || result.disclaimer !== 1 || result.contactUnavailable !== 1 || result.consoleErrors.length) || results[2].itineraryErrors.length || results[2].itineraryContextualGuides < 1) process.exit(1);
