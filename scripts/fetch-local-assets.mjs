/**
 * Downloads the web-sized stock photos into the gitignored `client/public/assets/`
 * directory so a fresh clone has imagery without packaging binaries in the repo.
 *
 * Source: the public GitHub Release `v2.0.0` for vinsu-hub/el-biyahe-stock-images.
 * Per-image attribution lives in scripts/destination-photo-manifest.json.
 * (The old vinsu-hub/kabiyahe-updated `v1.0.0-stock-images` release is kept as a
 * documented fallback but is no longer used.)
 *
 *   pnpm assets:download
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { existsSync, rmSync } from "node:fs";

const RELEASE_ZIP =
  process.env.ELBIYAHE_ASSET_ZIP_URL ||
  "https://github.com/vinsu-hub/el-biyahe-stock-images/releases/download/v2.0.0/el-biyahe-stock-images-v2.0.0.zip";
const ZIP_SHA256 = "de37a30255bb755baa16e44c158cb669bf5f66bf7002c04433d5810c1128adac";
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

const tmp = path.join(os.tmpdir(), `kabiyahe-stock-${Date.now()}`);

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tmp, { recursive: true });
  const zipPath = path.join(tmp, "stock.zip");

  console.log(`Downloading ${RELEASE_ZIP}`);
  const res = await fetch(RELEASE_ZIP, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== ZIP_SHA256) throw new Error(`Checksum mismatch:\n  expected ${ZIP_SHA256}\n  got      ${sha}`);
  console.log(`SHA-256 verified: ${sha}`);
  await writeFile(zipPath, buf);

  // Extract with a platform-native unzipper.
  if (process.platform === "win32") {
    execFileSync(
      "powershell",
      ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${tmp}' -Force`],
      { stdio: "inherit" },
    );
  } else {
    try {
      execFileSync("unzip", ["-o", "-q", zipPath, "-d", tmp], { stdio: "inherit" });
    } catch {
      execFileSync("tar", ["-xf", zipPath, "-C", tmp], { stdio: "inherit" });
    }
  }

  const imagesDir = path.join(tmp, "el-biyahe-stock-release", "images");
  for (const file of FILES) {
    const src = path.join(imagesDir, file);
    if (!existsSync(src)) throw new Error(`Missing ${file} in archive`);
    await writeFile(path.join(outputDir, file), await (await import("node:fs/promises")).readFile(src));
    console.log(`  ✓ ${file}`);
  }
  console.log(`\nSaved ${FILES.length} assets to ${outputDir}`);
}

main()
  .catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {}
  });
