/**
 * Generates lightweight themed SVG "photo" placeholders for El-Biyahe! until real
 * Los Baños photography is dropped into client/public/assets/.
 * Palette: deep green / leaf green / gold / maroon / cream.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("./client/public/scenes");
await mkdir(outDir, { recursive: true });

const scenes = {
  "elbiyahe-hero.svg":        { sky: ["#0B3D2E", "#2E7D32"], accent: "#FFC629", label: "Mt. Makiling, Los Baños", water: true, sun: true },
  "elbiyahe-lake.svg":        { sky: ["#125138", "#3f9a6b"], accent: "#FFF7E6", label: "Tadlac Lake", water: true, sun: false },
  "elbiyahe-falls.svg":       { sky: ["#0B3D2E", "#155C3F"], accent: "#DDEFE4", label: "Dampalit Falls", water: true, sun: false, falls: true },
  "elbiyahe-sunset.svg":      { sky: ["#8B1E3F", "#FFC629"], accent: "#FFF7E6", label: "Laguna de Bay sunset", water: true, sun: true },
  "elbiyahe-heritage.svg":    { sky: ["#0B3D2E", "#2E7D32"], accent: "#FFC629", label: "Heritage Los Baños", water: false, sun: true, church: true },
  "elbiyahe-campus.svg":      { sky: ["#134a34", "#5aa17c"], accent: "#FFF7E6", label: "UPLB Campus", water: false, sun: true, church: false, trees: true },
  "elbiyahe-market.svg":      { sky: ["#8B1E3F", "#c65a7d"], accent: "#FFC629", label: "ElBi Night Market", water: false, sun: false, tents: true },
  "elbiyahe-food.svg":        { sky: ["#b8860b", "#FFC629"], accent: "#0B3D2E", label: "ElBi Delicacies", water: false, sun: true },
  "elbiyahe-passport.svg":    { sky: ["#0B3D2E", "#8B1E3F"], accent: "#FFC629", label: "Digital LB Passport", water: false, sun: false, stamp: true },
  "elbiyahe-bus.svg":         { sky: ["#0B3D2E", "#2E7D32"], accent: "#FFC629", label: "El-Biyahe! Bus Tours", water: false, sun: true, road: true },
};

const svg = (s) => {
  const [c1, c2] = s.sky;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" font-family="Poppins,Segoe UI,sans-serif">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  ${s.sun ? `<circle cx="960" cy="180" r="70" fill="${s.accent}" opacity="0.85"/>` : ""}
  <path d="M0 520 L220 300 L360 430 L520 250 L720 470 L900 330 L1200 520 L1200 800 L0 800 Z" fill="#0B3D2E" opacity="0.55"/>
  <path d="M0 600 L260 430 L470 560 L700 400 L950 560 L1200 470 L1200 800 L0 800 Z" fill="#08301F" opacity="0.85"/>
  ${s.trees ? `<g fill="#08301F">${[120,300,1050,880].map(x=>`<path d="M${x} 620 l30 -120 l30 120 z"/>`).join("")}</g>` : ""}
  ${s.church ? `<g fill="#FFF7E6" opacity="0.9"><rect x="540" y="430" width="120" height="150"/><polygon points="540,430 600,360 660,430"/><rect x="586" y="300" width="28" height="130"/><polygon points="586,300 600,275 614,300"/></g>` : ""}
  ${s.tents ? `<g>${[["#8B1E3F",180],["#FFC629",430],["#2E7D32",680],["#FFF7E6",930]].map(([c,x])=>`<path d="M${x} 600 l90 -110 l90 110 z" fill="${c}" opacity="0.9"/>`).join("")}</g>` : ""}
  ${s.road ? `<path d="M480 800 L560 500 L640 500 L720 800 Z" fill="#FFF7E6" opacity="0.85"/><rect x="592" y="560" width="16" height="60" fill="#FFC629"/><rect x="592" y="670" width="16" height="60" fill="#FFC629"/>` : ""}
  ${s.falls ? `<rect x="560" y="300" width="80" height="260" fill="#DDEFE4" opacity="0.8"/>` : ""}
  ${s.stamp ? `<g transform="rotate(-8 600 400)"><rect x="470" y="300" width="260" height="200" rx="10" fill="none" stroke="${s.accent}" stroke-width="10" stroke-dasharray="4 14"/><text x="600" y="415" fill="${s.accent}" font-size="46" font-weight="800" text-anchor="middle">El-Biyahe!</text></g>` : ""}
  ${s.water ? `<rect y="620" width="1200" height="180" fill="#0B3D2E" opacity="0.4"/><rect y="620" width="1200" height="180" fill="${c2}" opacity="0.3"/>` : ""}
  <text x="60" y="740" fill="#FFF7E6" font-size="34" font-weight="700" opacity="0.95">${s.label}</text>
  <text x="60" y="775" fill="${s.accent}" font-size="18" font-weight="600" letter-spacing="3">EL-BIYAHE! · COME CURIOUS</text>
</svg>`;
};

for (const [name, s] of Object.entries(scenes)) {
  await writeFile(path.join(outDir, name), svg(s));
  console.log("wrote", name);
}
console.log(`\n${Object.keys(scenes).length} placeholder scenes written to ${outDir}`);
