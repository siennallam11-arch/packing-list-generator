// Renders every landmark city's banner to one HTML page, for checking the drawings.
// Run with: npx tsx scripts/banner-sheet.ts <out.html> [phase]
import { readFileSync, writeFileSync } from "node:fs";
import { LANDMARK_CITIES } from "../src/lib/banner/landmarks";
import { renderBanner } from "../src/lib/banner/render";
import { paletteVars } from "../src/lib/banner/sky";

const out = process.argv[2] ?? "banners.html";
const minutes = { day: 720, dawn: 410, dusk: 980, night: 1320 }[process.argv[3] ?? "day"] ?? 720;
const css = readFileSync("src/app/app.css", "utf8").split("/* City banner */")[1];
const doodle = readFileSync("src/components/Doodle.tsx", "utf8");
const sprite = JSON.parse(doodle.match(/const SPRITE = (".*");/)![1]) as string;
const cells = LANDMARK_CITIES.map((key) => {
  const [name, cc] = key.split("|");
  const b = renderBanner({ name, countryCode: cc, minutes, sunrise: 390, sunset: 1000, weather: "clear", cloudCover: 30 });
  const vars = Object.entries(paletteVars(b.palette)).map(([k, v]) => `${k}:${v}`).join(";");
  return `<figure><svg class="cbn" viewBox="0 0 1200 240" style="${vars}">${b.svg}</svg><figcaption>${name}</figcaption></figure>`;
}).join("");
writeFileSync(out, `<html><body style="margin:0;font:12px monospace;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;background:#ddd">
<svg width="0" height="0" style="position:absolute"><defs>${sprite}</defs></svg><style>${css} figure{margin:0;background:#fff} figure svg{height:auto;aspect-ratio:5/1}</style>${cells}</body></html>`);
