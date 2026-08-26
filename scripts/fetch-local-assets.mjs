import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.KABIYAHE_ASSET_BASE_URL || "https://3000-i6oxn24yy0ql6gq3jnvgc-8549b15a.sg1.manus.computer").replace(/\/$/, "");
const outputDir = path.resolve(process.env.KABIYAHE_LOCAL_ASSET_DIR || "./client/public/assets");
const files = [
  "kabiyahe-hero-laguna_e334210c.jpg",
  "kabiyahe-calinaya-lake_96b9ff18.jpg",
  "kabiyahe-pagsanjan-falls_bd37de01.jpg",
  "kabiyahe-bundles-sunset_99ff267e.jpg",
  "enchanted-kingdom_a3aaee52.jpg",
  "al-fresco-springs_c60eb0da.jpg",
  "laresio-lakeside_049170eb.jpg",
  "kabiyahe-emblem_04426ca6.png",
];

await mkdir(outputDir, { recursive: true });
for (const file of files) {
  const url = `${baseUrl}/manus-storage/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${file}: ${response.status} ${response.statusText}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(outputDir, file), bytes);
  console.log(`Downloaded ${file} (${bytes.length} bytes)`);
}
console.log(`Saved ${files.length} assets to ${outputDir}`);
