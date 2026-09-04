/**
 * Downloads the web-sized stock photos into the gitignored `client/public/assets/`
 * directory so a fresh clone (and the Vercel build) has imagery without packaging
 * binaries in the repo.
 *
 * Source: the individual assets on the public GitHub Release `v2.0.0` for
 * vinsu-hub/el-biyahe-stock-images. Per-image attribution lives in
 * scripts/destination-photo-manifest.json. Downloading files individually (rather
 * than one zip) keeps this platform-independent — no unzip binary required.
 *
 *   pnpm assets:download
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const RELEASE_BASE =
  process.env.ELBIYAHE_ASSET_BASE_URL ||
  "https://github.com/vinsu-hub/el-biyahe-stock-images/releases/download/v2.0.0";
const outputDir = path.resolve(process.env.ELBIYAHE_LOCAL_ASSET_DIR || "./client/public/assets");

const FILES = [
  "elbiyahe-pagsanjan-falls.jpg",
  "elbiyahe-caliraya-lake.jpg",
  "elbiyahe-majayjay-church.jpg",
  "elbiyahe-los-banos-hot-springs.jpg",
  "elbiyahe-nuvali-lakeside.jpg",
  "elbiyahe-rizal-shrine.jpg",
  "elbiyahe-seven-crater-lakes.jpg",
  "elbiyahe-mount-makiling.jpg",
  "elbiyahe-makiling-trail.jpg",
  "elbiyahe-makiling-mud-spring.jpg",
  "elbiyahe-paete-church.jpg",
  "elbiyahe-enchanted-kingdom.jpg",
  "elbiyahe-makiling-botanic-gardens.jpg",
  "elbiyahe-uplb-mnh.jpg",
  "elbiyahe-uplb-fertility-tree.jpg",
  "elbiyahe-uplb-campus.jpg",
  "elbiyahe-riceworld-museum.jpg",
  "elbiyahe-st-therese-church.jpg",
  "elbiyahe-san-antonio-parish.jpg",
  "elbiyahe-los-banos-municipal-hall.jpg",
  "elbiyahe-los-banos-public-market.jpg",
  "elbiyahe-hero-losbanos.jpg",
  "elbiyahe-laguna-lake.jpg",
  "elbiyahe-laguna-sunset.jpg",
  "elbiyahe-al-fresco-springs.jpg",
  "elbiyahe-laresio-lakeside.jpg",
];

async function fetchWithRetry(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      if (res.status < 500 && res.status !== 429) throw new Error(`${res.status} ${res.statusText}`);
    } catch (e) {
      if (i === tries) throw e;
    }
    await new Promise(r => setTimeout(r, 800 * i));
  }
  throw new Error("unreachable");
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  let ok = 0;
  for (const file of FILES) {
    const buf = await fetchWithRetry(`${RELEASE_BASE}/${file}`);
    if (buf.length < 1024) throw new Error(`${file}: suspiciously small (${buf.length} bytes)`);
    await writeFile(path.join(outputDir, file), buf);
    ok++;
    console.log(`  ✓ ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
  }
  console.log(`\nSaved ${ok}/${FILES.length} assets to ${outputDir}`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exitCode = 1;
});
