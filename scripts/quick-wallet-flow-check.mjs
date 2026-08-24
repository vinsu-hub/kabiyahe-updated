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

  await page.goto(`${baseUrl}/trips/laguna-weekend`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Laguna Weekend Escape" }).waitFor();
  const detailQuickButtons = await page.getByRole("link", { name: "Quick reference" }).count();
  await page.getByRole("link", { name: "Quick reference" }).click();
  const detailWalletRoute = page.url().includes("/trips/laguna-weekend/wallet");

  await page.goto(`${baseUrl}/trips`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "My Trips" }).waitFor();
  const quickButtons = await page.getByRole("button", { name: "Quick reference" }).count();
  await page.getByRole("button", { name: "Quick reference" }).first().click();
  await page.getByRole("heading", { name: "Quick references" }).waitFor();
  const codeCount = await page.getByText("PBR-2406-18").count();
  const routeNote = await page.getByText("For the full ticket screenshot, notes, and sharing controls, open the trip wallet.").count();
  await page.getByRole("link", { name: "Open full wallet" }).click();
  const walletRoute = page.url().includes("/trips/laguna-weekend/wallet");
  results.push({ label, detailQuickButtons, detailWalletRoute, quickButtons, codeCount, routeNote, walletRoute, consoleErrors });
  await browser.close();
}

console.log(JSON.stringify({ baseUrl, results }, null, 2));
if (results.some(result => result.detailQuickButtons !== 1 || !result.detailWalletRoute || result.quickButtons !== 2 || result.codeCount !== 1 || result.routeNote !== 1 || !result.walletRoute || result.consoleErrors.length)) process.exit(1);
