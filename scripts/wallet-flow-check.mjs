import { chromium } from "playwright";

const baseUrl = process.env.WALLET_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const results = [];

for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error" && !message.text().includes("status of 401 (Unauthorized)")) consoleErrors.push(message.text()); });
  page.on("pageerror", error => consoleErrors.push(error.message));
  await page.goto(`${baseUrl}/trips/laguna-weekend/wallet`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Booking references" }).waitFor();
  const uploadControls = await page.getByText("Upload ticket screenshot", { exact: true }).count();
  const loginRequired = await page.getByText("Sign in to access private ticket screenshots.", { exact: true }).count();
  await page.locator('input[type="file"]').first().setInputFiles({ name: "ticket.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await page.getByText("Please choose a JPG or PNG ticket screenshot.").waitFor();
  results.push({ viewport: viewport.name, uploadControls, loginRequired, consoleErrors });
  await page.close();
}

await browser.close();
console.log(JSON.stringify({ baseUrl, results }, null, 2));
if (results.some(result => result.uploadControls !== 2 || result.loginRequired !== 1 || result.consoleErrors.length > 0)) process.exitCode = 1;
