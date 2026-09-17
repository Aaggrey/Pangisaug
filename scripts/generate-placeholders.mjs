import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "uploads", "images");
await mkdir(outDir, { recursive: true });

const palettes = [
  ["#0f766e", "#38bdf8"],
  ["#1e293b", "#0d9488"],
  ["#7c3aed", "#ec4899"],
  ["#b45309", "#f97316"],
  ["#1d4ed8", "#22d3ee"],
  ["#9d174d", "#fb923c"],
  ["#065f46", "#4ade80"],
  ["#334155", "#64748b"],
  ["#0e7490", "#a5f3fc"],
  ["#581c87", "#f472b6"],
  ["#475569", "#cbd5e1"],
  ["#166534", "#facc15"],
];

const house = `
<g transform="translate(340 140) scale(1.6)">
  <path d="M20 120 L20 55 L70 10 L120 55 L120 120 Z" fill="rgba(255,255,255,0.92)"/>
  <rect x="32" y="65" width="26" height="24" fill="rgba(15,23,42,0.35)"/>
  <rect x="68" y="72" width="32" height="48" fill="rgba(15,23,42,0.28)"/>
  <rect x="16" y="120" width="108" height="10" fill="rgba(15,23,42,0.3)"/>
</g>`;

const heroHouse = `
<g transform="translate(330 130) scale(1.9)">
  <path d="M20 120 L20 55 L70 10 L120 55 L120 120 Z" fill="rgba(255,255,255,0.95)"/>
  <rect x="32" y="65" width="26" height="24" fill="rgba(15,23,42,0.35)"/>
  <rect x="68" y="72" width="32" height="48" fill="rgba(15,23,42,0.28)"/>
  <rect x="16" y="120" width="108" height="10" fill="rgba(15,23,42,0.3)"/>
</g>`;

function svg(width, height, [c1, c2], label, glyph) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>
  <linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(0,0,0,0.0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" fill="url(#g)"/>
<rect width="${width}" height="${height}" fill="url(#ov)"/>
${glyph}
<text x="28" y="${height - 32}" font-family="Arial, sans-serif" font-size="${Math.round(height / 16)}" font-weight="700" fill="rgba(255,255,255,0.95)">${label}</text>
</svg>`;
}

for (let i = 0; i < 3; i++) {
  const p = palettes[i % palettes.length];
  const label = ["Find your dream home", "Top city locations", "Verified listings"][i];
  await writeFile(
    path.join(outDir, `hero-${i + 1}.svg`),
    svg(1600, 900, p, label, heroHouse)
  );
}

const areas = ["Manila Bay", "Quezon City", "Baguio", "Cebu", "Davao", "Makati", "Tagaytay", "Iloilo", "Cagayan de Oro", "Bacolod", "Tacloban", "Naga"];
for (let i = 0; i < 12; i++) {
  const p = palettes[i % palettes.length];
  await writeFile(
    path.join(outDir, `prop-${i + 1}.svg`),
    svg(800, 600, p, `Property in ${areas[i]}`, house)
  );
}

console.log("Placeholder images generated.");