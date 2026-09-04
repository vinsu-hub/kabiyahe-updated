/**
 * Phase 10 packager. Downloads the Wikimedia Commons source images listed in
 * scripts/destination-photo-manifest.json, resizes them to web dimensions, folds
 * in the handful of still-referenced legacy stock photos under their new
 * elbiyahe-* names, and produces the archive published as the
 * vinsu-hub/el-biyahe-stock-images GitHub release.
 *
 *   node scripts/build-destination-photos.mjs
 *
 * Output: scratchpad/el-biyahe-stock-images-v2.0.0.zip  (+ printed SHA-256)
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, rm, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "scripts/destination-photo-manifest.json"), "utf8"));
const outRoot = path.join(root, "scratchpad-build");
const imagesDir = path.join(outRoot, "el-biyahe-stock-release", "images");
const MAX_W = 1600;
const UA = { "User-Agent": "ElBiyahe-photo-sourcing/1.0 (neilmedallon1@gmail.com)" };

// legacy stock photos still referenced after the migration, renamed elbiyahe-*
const LEGACY = [
  ["client/public/assets/kabiyahe-hero-laguna_e334210c.jpg", "elbiyahe-hero-losbanos.jpg"],
  ["client/public/assets/kabiyahe-calinaya-lake_96b9ff18.jpg", "elbiyahe-laguna-lake.jpg"],
  ["client/public/assets/kabiyahe-bundles-sunset_99ff267e.jpg", "elbiyahe-laguna-sunset.jpg"],
  ["client/public/assets/al-fresco-springs_c60eb0da.jpg", "elbiyahe-al-fresco-springs.jpg"],
  ["client/public/assets/laresio-lakeside_049170eb.jpg", "elbiyahe-laresio-lakeside.jpg"],
];

async function normalize(buf, file) {
  const out = await sharp(buf).rotate().resize({ width: MAX_W, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  await writeFile(path.join(imagesDir, file), out);
  return out.length;
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(imagesDir, { recursive: true });

const written = [];
for (const img of manifest.images) {
  const res = await fetch(img.source, { headers: UA, redirect: "follow" });
  if (!res.ok) throw new Error(`${img.file}: download ${res.status}`);
  const size = await normalize(Buffer.from(await res.arrayBuffer()), img.file);
  written.push([img.file, size]);
  console.log(`  ✓ ${img.file}  (${(size / 1024).toFixed(0)} KB)  <- ${img.author} / ${img.license}`);
}
for (const [src, file] of LEGACY) {
  const size = await normalize(await readFile(path.join(root, src)), file);
  written.push([file, size]);
  console.log(`  ✓ ${file}  (${(size / 1024).toFixed(0)} KB)  <- legacy`);
}

// zip (archive root: el-biyahe-stock-release/images/*)
const zipPath = path.join(outRoot, "el-biyahe-stock-images-v2.0.0.zip");
execFileSync("powershell", ["-NoProfile", "-Command",
  `Compress-Archive -Path '${path.join(outRoot, "el-biyahe-stock-release")}' -DestinationPath '${zipPath}' -Force`],
  { stdio: "inherit" });

const zipBuf = await readFile(zipPath);
const sha = createHash("sha256").update(zipBuf).digest("hex");
console.log(`\n${written.length} images, zip ${(zipBuf.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`zip: ${zipPath}`);
console.log(`SHA-256: ${sha}`);
console.log(`\nFILES list for fetch-local-assets.mjs:\n${written.map(([f]) => `  "${f}",`).join("\n")}`);
await readdir(imagesDir); // touch
