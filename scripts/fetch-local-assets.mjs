/**
 * Downloads the eight stock photos into the gitignored `client/public/assets/`
 * directory so a fresh clone has imagery without packaging binaries in the repo.
 *
 * Source: the public GitHub Release `v1.0.0-stock-images` for
 * vinsu-hub/kabiyahe-updated (the original Manus `/manus-storage/` host is gone).
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
  "https://github.com/vinsu-hub/kabiyahe-updated/releases/download/v1.0.0-stock-images/kabiyahe-stock-images-v1.0.0.zip";
const ZIP_SHA256 = "33b1439e525dbc26af1dd80618e932170be8948164a2ca9696c9944b27028b7d";
const outputDir = path.resolve(process.env.ELBIYAHE_LOCAL_ASSET_DIR || "./client/public/assets");

const FILES = [
  "kabiyahe-hero-laguna_e334210c.jpg",
  "kabiyahe-calinaya-lake_96b9ff18.jpg",
  "kabiyahe-pagsanjan-falls_bd37de01.jpg",
  "kabiyahe-bundles-sunset_99ff267e.jpg",
  "enchanted-kingdom_a3aaee52.jpg",
  "al-fresco-springs_c60eb0da.jpg",
  "laresio-lakeside_049170eb.jpg",
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

  const imagesDir = path.join(tmp, "kabiyahe-stock-release", "images");
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
