// Builds the banner picture: sky for the local time, the city's skyline, and the weather.

import { GROUND, landmarkFor, palm, tree, type LandmarkSpec } from "./landmarks";
import { PALETTES, phaseAt, seeded, skyBody, type Palette, type Phase, type Weather } from "./sky";

export interface BannerInput {
  name: string;
  countryCode?: string;
  population?: number;
  elevation?: number;
  /** Local minutes past midnight */
  minutes: number;
  sunrise: number;
  sunset: number;
  weather: Weather;
  cloudCover: number;
  /** Drawing width (240 tall). Wider screens get a wider scene instead of a cropped one. */
  width?: number;
}

export interface Banner {
  svg: string;
  phase: Phase;
  palette: Palette;
  hasLandmark: boolean;
}

const BASE = 1200;
const H = 240;

function specFor(input: BannerInput): { spec: LandmarkSpec; landmark: boolean } {
  const known = landmarkFor(input.name, input.countryCode);
  if (known) return { spec: { ...known, mountains: known.mountains || (input.elevation ?? 0) > 700 }, landmark: !!known.draw };
  const pop = input.population ?? 300000;
  const skyline = pop > 1_500_000 ? "tall" : pop > 150_000 ? "mid" : "low";
  return { spec: { skyline, mountains: (input.elevation ?? 0) > 700, trees: skyline !== "tall" }, landmark: false };
}

function cloud(x: number, y: number, s: number): string {
  return `<path class="cl" d="M${x} ${y} q${-4 * s} ${-14 * s} ${10 * s} ${-14 * s} q${6 * s} ${-14 * s} ${22 * s} ${-8 * s} q${14 * s} ${-6 * s} ${20 * s} ${8 * s} q${12 * s} ${2 * s} ${8 * s} ${14 * s}Z"/>`;
}

function buildings(rng: () => number, kind: "tall" | "mid" | "low", clear: [number, number] | undefined, night: boolean, W: number): string {
  const [lo, top] = kind === "tall" ? [70, 165] : kind === "mid" ? [40, 112] : [26, 64];
  // With a landmark, keep the neighbours lower so it stands out.
  const hi = clear ? lo + (top - lo) * 0.45 : top;
  let s = "";
  let x = -12;
  while (x < W + 10) {
    const w = Math.round(30 + rng() * (kind === "low" ? 30 : 42));
    if (clear && x + w > clear[0] && x < clear[1]) {
      x = clear[1] + 4 + Math.round(rng() * 10);
      continue;
    }
    // Taller towards the middle, shorter at the edges.
    const centre = 1 - Math.min(1, Math.abs(x + w / 2 - W / 2) / (W / 2));
    const h = Math.round(lo + (hi - lo) * (0.35 * rng() + 0.65 * centre * rng()));
    const top = GROUND - h;
    const r = rng();
    const fill = r < 0.08 ? "p" : r < 0.14 ? "u" : r < 0.19 ? "t" : r < 0.55 ? "b" : "b2";
    if (kind === "low" && rng() < 0.6) {
      s += `<polygon class="${fill}" points="${x},${GROUND} ${x},${top + 12} ${x + w / 2},${top - 8} ${x + w},${top + 12} ${x + w},${GROUND}"/>`;
    } else {
      s += `<rect class="${fill}" x="${x}" y="${top}" width="${w}" height="${h}"/>`;
      const roof = rng();
      if (roof < 0.2) s += `<path class="n" d="M${x + w * 0.6} ${top} V${top - 14 - rng() * 12}"/>`;
      else if (roof < 0.3) s += `<rect class="b2" x="${x + w * 0.2}" y="${top - 8}" width="${w * 0.3}" height="8"/>`;
      else if (roof < 0.36 && kind !== "tall") s += `<path class="${fill === "b" ? "b2" : "b"}" d="M${x + 4} ${top} Q${x + w / 2} ${top - w * 0.5} ${x + w - 4} ${top}Z"/>`;
    }
    const cols = Math.max(1, Math.floor((w - 10) / 10));
    const rows = Math.max(1, Math.floor((h - (kind === "low" ? 22 : 16)) / 16));
    for (let rr = 0; rr < Math.min(rows, 12); rr++)
      for (let cc = 0; cc < cols; cc++) {
        const lit = !night || rng() < 0.62;
        s += `<rect class="${lit ? "w" : "w0"}" x="${x + 6 + cc * 10}" y="${top + 10 + rr * 16 + (kind === "low" ? 10 : 0)}" width="4" height="6"/>`;
      }
    x += w + Math.round(rng() * 6);
  }
  return s;
}

function farSkyline(rng: () => number, kind: "tall" | "mid" | "low", landmark: boolean, W: number): string {
  if (kind === "low") return "";
  const max = (kind === "tall" ? 150 : 95) * (landmark ? 0.55 : 1);
  let s = "";
  for (let x = -10; x < W; ) {
    const w = 24 + rng() * 40;
    const h = 30 + rng() * max;
    s += `<rect class="far" x="${x.toFixed(0)}" y="${(GROUND - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
    x += w + rng() * 4;
  }
  return s;
}

function mountains(rng: () => number, snowy: boolean, W: number): string {
  let d = `M-10 ${GROUND}`;
  const peaks: [number, number][] = [];
  for (let x = -10; x <= W + 60; x += 120 + rng() * 120) {
    const y = 70 + rng() * 70;
    peaks.push([x, y]);
    d += ` L${x.toFixed(0)} ${y.toFixed(0)} L${(x + 60 + rng() * 40).toFixed(0)} ${(y + 40 + rng() * 30).toFixed(0)}`;
  }
  d += ` L${W + 10} ${GROUND}Z`;
  let s = `<path class="mt" d="${d}"/>`;
  if (snowy) for (const [x, y] of peaks) s += `<path class="snowcap" d="M${(x - 14).toFixed(0)} ${(y + 16).toFixed(0)} L${x.toFixed(0)} ${y.toFixed(0)} L${(x + 14).toFixed(0)} ${(y + 12).toFixed(0)} L${(x + 4).toFixed(0)} ${(y + 18).toFixed(0)}Z"/>`;
  return s;
}

function weatherLayer(rng: () => number, weather: Weather, W: number): string {
  let s = "";
  if (weather === "rain" || weather === "storm") {
    for (let i = 0; i < Math.round((70 * W) / BASE); i++) {
      const x = rng() * (W + 60) - 30;
      const y = rng() * (H - 40);
      s += `<path class="rain" d="M${x.toFixed(0)} ${y.toFixed(0)} l-6 16"/>`;
    }
  }
  if (weather === "storm") s += `<path class="bolt" d="M${W / 2 + 220} 40 l-18 44 h16 l-14 40 l34 -52 h-16 l14 -32Z"/>`;
  if (weather === "snow") {
    for (let i = 0; i < Math.round((80 * W) / BASE); i++) s += `<circle class="snow" cx="${(rng() * W).toFixed(0)}" cy="${(rng() * (H - 30)).toFixed(0)}" r="${(1.5 + rng() * 2.2).toFixed(1)}"/>`;
  }
  if (weather === "fog") for (let i = 0; i < 4; i++) s += `<rect class="fog" x="-20" y="${100 + i * 30}" width="${W + 40}" height="14" rx="7"/>`;
  return s;
}

export function renderBanner(input: BannerInput): Banner {
  const W = Math.max(BASE, Math.round(input.width ?? BASE));
  const off = Math.round((W - BASE) / 2);
  const phase = phaseAt(input.minutes, input.sunrise, input.sunset);
  const palette = PALETTES[phase];
  const night = phase === "night";
  const rng = seeded(`${input.name}|${input.countryCode ?? ""}`);
  const wx = seeded(`${input.name}|weather|${Math.floor(input.minutes / 10)}`);
  const { spec, landmark } = specFor(input);

  let s = `<defs><linearGradient id="cbn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.skyTop}"/><stop offset="1" stop-color="${palette.skyBottom}"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#cbn-sky)"/>`;

  if (night) {
    const stars = seeded(`${input.name}|stars`);
    for (let i = 0; i < Math.round((46 * W) / BASE); i++) s += `<circle class="star" cx="${(stars() * W).toFixed(0)}" cy="${(stars() * 130).toFixed(0)}" r="${(0.8 + stars() * 1.6).toFixed(1)}"/>`;
  }

  const body = skyBody(input.minutes, input.sunrise, input.sunset);
  const bx = 70 + body.x * (W - 140);
  const by = 196 - body.height * 156;
  if (input.weather !== "fog" && !(input.weather === "cloudy" && input.cloudCover > 90)) {
    s += body.kind === "sun"
      ? `<g class="ink"><circle class="sun" cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="24"/></g>`
      : `<g class="ink"><path class="moon" d="M${(bx + 6).toFixed(0)} ${(by - 22).toFixed(0)} a22 22 0 1 0 16 38 a17 17 0 1 1 -16 -38Z"/></g>`;
  }

  const cloudCount = input.weather === "clear" ? (input.cloudCover > 20 ? 1 : 0) : input.weather === "cloudy" ? 2 + Math.round((input.cloudCover / 100) * 3) : 4;
  let clouds = "";
  for (let i = 0; i < cloudCount; i++) clouds += cloud(60 + wx() * (W - 200), 64 + wx() * 50, 1.2 + wx() * 1.1);
  if (clouds) s += `<g class="ink${input.weather !== "clear" && input.weather !== "cloudy" ? " grey" : ""}">${clouds}</g>`;

  if (spec.mountains) s += `<g class="ink soft">${mountains(rng, (input.elevation ?? 0) > 1500 || spec.skyline === "low", W)}</g>`;
  s += farSkyline(rng, spec.skyline, landmark, W);

  const clear = landmark ? (spec.clear ?? [520, 680]).map((x) => x + off) as [number, number] : undefined;
  let city = buildings(rng, spec.skyline, clear, night, W);
  if (spec.trees || spec.skyline === "low") {
    for (let i = 0; i < Math.round((6 * W) / BASE); i++) {
      const x = Math.round(rng() * W);
      if (clear && x > clear[0] - 10 && x < clear[1] + 10) continue;
      city += rng() < 0.15 && spec.water ? palm(x, 60) : tree(x, 10 + Math.round(rng() * 6));
    }
  }
  if (landmark && spec.draw) city += off ? `<g transform="translate(${off} 0)">${spec.draw()}</g>` : spec.draw();
  s += `<g class="ink">${city}</g>`;

  s += spec.water
    ? `<rect class="water" x="0" y="${GROUND}" width="${W}" height="${H - GROUND}"/><path class="wave" d="${Array.from({ length: Math.ceil(W / 250) }, (_, i) => `M${40 + i * 250} ${i % 2 ? 232 : 225} q10 -5 20 0 t20 0`).join(" ")}"/>`
    : `<rect class="ground" x="0" y="${GROUND}" width="${W}" height="${H - GROUND}"/>`;
  s += `<path class="groundline" d="M0 ${GROUND} H${W}"/>`;
  s += weatherLayer(wx, input.weather, W);

  return { svg: s, phase, palette, hasLandmark: landmark };
}
