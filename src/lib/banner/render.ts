// Builds the banner picture: sky for the local time, the city's skyline in three layers of
// depth, light and shade, the weather, and a fine paper grain over everything.

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
type Kind = "tall" | "mid" | "low";

// ── Colour helpers ──────────────────────────────────────────────

function rgb(hex: string): number[] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
/** Blend colour a towards b by t (0–1). */
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function hashId(text: string): string {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return "cbn" + (h >>> 0).toString(36);
}

function specFor(input: BannerInput): { spec: LandmarkSpec; landmark: boolean } {
  const known = landmarkFor(input.name, input.countryCode);
  if (known) return { spec: { ...known, mountains: known.mountains || (input.elevation ?? 0) > 700 }, landmark: !!known.draw };
  const pop = input.population ?? 300000;
  const skyline: Kind = pop > 1_500_000 ? "tall" : pop > 150_000 ? "mid" : "low";
  return { spec: { skyline, mountains: (input.elevation ?? 0) > 700, trees: skyline !== "tall" }, landmark: false };
}

// ── Pieces ──────────────────────────────────────────────────────

function cloud(x: number, y: number, s: number, id: string): string {
  const d = `M${x} ${y} q${-4 * s} ${-14 * s} ${10 * s} ${-14 * s} q${6 * s} ${-14 * s} ${22 * s} ${-8 * s} q${14 * s} ${-6 * s} ${20 * s} ${8 * s} q${12 * s} ${2 * s} ${8 * s} ${14 * s}Z`;
  return `<path class="cl" fill="url(#${id}-cl)" d="${d}"/>`;
}

interface Built {
  shapes: string;
  windows: string;
}

/** A row of buildings with rooftops, windows and shopfronts. */
function buildings(rng: () => number, kind: Kind, clear: [number, number] | undefined, night: boolean, W: number, scale = 1, detail = true): Built {
  const [lo, top] = kind === "tall" ? [70, 165] : kind === "mid" ? [40, 112] : [26, 64];
  const hi = (clear ? lo + (top - lo) * 0.45 : top) * scale;
  const low = lo * scale;
  let shapes = "";
  let wins = "";
  let x = -14;
  while (x < W + 10) {
    const w = Math.round(30 + rng() * (kind === "low" ? 30 : 44));
    if (clear && x + w > clear[0] && x < clear[1]) {
      x = clear[1] + 4 + Math.round(rng() * 10);
      continue;
    }
    const centre = 1 - Math.min(1, Math.abs(x + w / 2 - W / 2) / (W / 2));
    const h = Math.round(low + (hi - low) * (0.35 * rng() + 0.65 * centre * rng()));
    const t = GROUND - h;
    const r = rng();
    const fill = r < 0.08 ? "p" : r < 0.14 ? "u" : r < 0.19 ? "t" : r < 0.55 ? "b" : "b2";
    const house = kind === "low" && rng() < 0.6;

    if (house) {
      shapes += `<rect class="${fill}" x="${x}" y="${t + 12}" width="${w}" height="${h - 12}"/>`;
      shapes += `<polygon class="${rng() < 0.5 ? "t" : "p"}" points="${x - 3},${t + 13} ${x + w / 2},${t - 8} ${x + w + 3},${t + 13}"/>`;
      if (rng() < 0.5) shapes += `<rect class="b2" x="${x + w * 0.7}" y="${t - 4}" width="5" height="12"/>`;
      if (detail) {
        shapes += `<rect class="b2" x="${x + w / 2 - 5}" y="${GROUND - 14}" width="10" height="14"/>`;
        wins += `<rect class="${!night || rng() < 0.7 ? "w" : "w0"}" x="${x + 6}" y="${t + 20}" width="8" height="8"/>`;
        if (w > 34) wins += `<rect class="${!night || rng() < 0.7 ? "w" : "w0"}" x="${x + w - 14}" y="${t + 20}" width="8" height="8"/>`;
      }
    } else {
      shapes += `<rect class="${fill}" x="${x}" y="${t}" width="${w}" height="${h}"/>`;
      if (detail) shapes += `<rect class="b2" x="${x - 2}" y="${t - 3}" width="${w + 4}" height="4"/>`;
      // Rooftops
      const roof = rng();
      if (kind === "tall" && roof < 0.25) {
        const sw = Math.round(w * 0.6);
        const sh = 10 + Math.round(rng() * 22);
        shapes += `<rect class="${fill}" x="${x + (w - sw) / 2}" y="${t - 3 - sh}" width="${sw}" height="${sh}"/>`;
        if (rng() < 0.5) shapes += `<path class="n" d="M${x + w / 2} ${t - 3 - sh} V${t - 3 - sh - 16 - rng() * 14}"/>`;
      } else if (roof < 0.4) {
        shapes += `<path class="n" d="M${x + w * 0.65} ${t - 3} V${t - 16 - rng() * 12}"/>`;
      } else if (roof < 0.5 && kind !== "low") {
        const cx = x + w * 0.3;
        shapes += `<path class="n" d="M${cx - 5} ${t - 3} L${cx - 4} ${t - 12} M${cx + 5} ${t - 3} L${cx + 4} ${t - 12}"/>`;
        shapes += `<rect class="t" x="${cx - 7}" y="${t - 22}" width="14" height="11" rx="2"/><polygon class="t" points="${cx - 8},${t - 22} ${cx},${t - 29} ${cx + 8},${t - 22}"/>`;
      } else if (roof < 0.57 && kind !== "tall") {
        shapes += `<path class="${fill === "b" ? "b2" : "b"}" d="M${x + 4} ${t - 3} Q${x + w / 2} ${t - 3 - w * 0.5} ${x + w - 4} ${t - 3}Z"/>`;
      }
      // Windows
      if (detail) {
        const style = rng();
        const rows = Math.max(1, Math.floor((h - 26) / 15));
        if (style < 0.22 && kind !== "low") {
          for (let rr = 0; rr < Math.min(rows, 11); rr++) wins += `<rect class="${!night || rng() < 0.65 ? "w" : "w0"}" x="${x + 5}" y="${t + 8 + rr * 15}" width="${w - 10}" height="4"/>`;
        } else if (style < 0.38 && kind !== "low") {
          const cols = Math.max(1, Math.floor((w - 8) / 12));
          for (let cc = 0; cc < cols; cc++) wins += `<rect class="${!night || rng() < 0.65 ? "w" : "w0"}" x="${x + 6 + cc * 12}" y="${t + 8}" width="4" height="${h - 34}"/>`;
        } else {
          const cols = Math.max(1, Math.floor((w - 10) / 10));
          for (let rr = 0; rr < Math.min(rows, 11); rr++)
            for (let cc = 0; cc < cols; cc++) wins += `<rect class="${!night || rng() < 0.6 ? "w" : "w0"}" x="${x + 6 + cc * 10}" y="${t + 8 + rr * 15}" width="4" height="6"/>`;
        }
        // Shopfront with an awning
        if (kind !== "tall" && w > 34 && rng() < 0.35) {
          const ac = rng() < 0.5 ? "p" : "u";
          shapes += `<path class="${ac}" d="M${x + 3} ${GROUND - 24} H${x + w - 3} L${x + w - 1} ${GROUND - 17} ${Array.from({ length: Math.floor((w - 4) / 8) }, (_, i) => `Q${x + w - 5 - i * 8} ${GROUND - 13} ${x + w - 9 - i * 8} ${GROUND - 17}`).join(" ")} L${x + 1} ${GROUND - 17}Z"/>`;
          wins += `<rect class="w" x="${x + 6}" y="${GROUND - 15}" width="${w - 22}" height="9"/>`;
        }
      }
    }
    x += w + Math.round(rng() * 6);
  }
  return { shapes, windows: wins };
}

function farSkyline(rng: () => number, kind: Kind, landmark: boolean, W: number): string {
  if (kind === "low") return "";
  const max = (kind === "tall" ? 150 : 95) * (landmark ? 0.55 : 1);
  let s = "";
  for (let x = -10; x < W; ) {
    const w = 24 + rng() * 40;
    const h = 30 + rng() * max;
    s += `<rect class="far" x="${x.toFixed(0)}" y="${(GROUND - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
    if (rng() < 0.15) s += `<rect class="far" x="${(x + w / 2 - 1).toFixed(0)}" y="${(GROUND - h - 14).toFixed(0)}" width="2" height="14"/>`;
    x += w + rng() * 4;
  }
  return s;
}

function mountains(rng: () => number, snowy: boolean, W: number, id: string): string {
  let back = `M-10 ${GROUND}`;
  let front = `M-10 ${GROUND}`;
  const peaks: [number, number][] = [];
  for (let x = -10; x <= W + 60; x += 120 + rng() * 120) {
    const y = 70 + rng() * 70;
    peaks.push([x, y]);
    back += ` L${x.toFixed(0)} ${y.toFixed(0)} L${(x + 60 + rng() * 40).toFixed(0)} ${(y + 40 + rng() * 30).toFixed(0)}`;
    front += ` L${(x + 70).toFixed(0)} ${(y + 34 + rng() * 20).toFixed(0)} L${(x + 130 + rng() * 30).toFixed(0)} ${(y + 70 + rng() * 20).toFixed(0)}`;
  }
  back += ` L${W + 10} ${GROUND}Z`;
  front += ` L${W + 10} ${GROUND}Z`;
  let s = `<path class="mt" fill="url(#${id}-mtb)" d="${back}"/><path class="mt" fill="url(#${id}-mt)" d="${front}"/>`;
  if (snowy) for (const [x, y] of peaks) s += `<path class="snowcap" d="M${(x - 14).toFixed(0)} ${(y + 16).toFixed(0)} L${x.toFixed(0)} ${y.toFixed(0)} L${(x + 14).toFixed(0)} ${(y + 12).toFixed(0)} L${(x + 5).toFixed(0)} ${(y + 17).toFixed(0)} L${x.toFixed(0)} ${(y + 12).toFixed(0)} L${(x - 6).toFixed(0)} ${(y + 18).toFixed(0)}Z"/>`;
  return s;
}

function lamps(W: number, clear: [number, number] | undefined, night: boolean): { shapes: string; glow: string } {
  let shapes = "";
  let glow = "";
  for (let x = 70; x < W; x += 170) {
    if (clear && x > clear[0] - 20 && x < clear[1] + 20) continue;
    shapes += `<path class="n" d="M${x} ${GROUND} V${GROUND - 34} q0 -6 7 -6"/><rect class="b2" x="${x + 5}" y="${GROUND - 42}" width="8" height="5" rx="2"/>`;
    if (night) glow += `<circle class="lampglow" cx="${x + 9}" cy="${GROUND - 36}" r="14"/>`;
  }
  return { shapes, glow };
}

function weatherLayer(rng: () => number, weather: Weather, W: number): string {
  let s = "";
  if (weather === "rain" || weather === "storm") {
    for (let i = 0; i < Math.round((90 * W) / BASE); i++) {
      const x = rng() * (W + 60) - 30;
      const y = rng() * (H - 30);
      s += `<path class="rain" d="M${x.toFixed(0)} ${y.toFixed(0)} l-5 ${(12 + rng() * 8).toFixed(0)}"/>`;
    }
  }
  if (weather === "storm") s += `<path class="bolt" d="M${W / 2 + 220} 40 l-18 44 h16 l-14 40 l34 -52 h-16 l14 -32Z"/>`;
  if (weather === "snow") {
    for (let i = 0; i < Math.round((90 * W) / BASE); i++) s += `<circle class="snow" cx="${(rng() * W).toFixed(0)}" cy="${(rng() * (H - 20)).toFixed(0)}" r="${(1.2 + rng() * 2.4).toFixed(1)}"/>`;
  }
  if (weather === "fog") for (let i = 0; i < 5; i++) s += `<rect class="fog" x="-20" y="${90 + i * 26}" width="${W + 40}" height="16" rx="8"/>`;
  return s;
}

// ── The whole picture ──────────────────────────────────────────

export function renderBanner(input: BannerInput): Banner {
  const W = Math.max(BASE, Math.round(input.width ?? BASE));
  const off = Math.round((W - BASE) / 2);
  const phase = phaseAt(input.minutes, input.sunrise, input.sunset);
  const p = palette(phase);
  const night = phase === "night";
  const rng = seeded(`${input.name}|${input.countryCode ?? ""}`);
  const midRng = seeded(`${input.name}|mid`);
  const wx = seeded(`${input.name}|weather|${Math.floor(input.minutes / 10)}`);
  const { spec, landmark } = specFor(input);
  const id = hashId(`${input.name}|${input.countryCode}|${phase}|${W}|${input.weather}`);
  const glowColour = phase === "dusk" ? "#ffb38a" : phase === "dawn" ? "#ffd2b8" : phase === "day" ? "#ffffff" : "#6c6aa6";

  // Gradients give every shape a lit side and a shaded side.
  const fills: Record<string, string> = { b: p.building, b2: p.building2, p: p.pink, g: p.green, u: p.blue, t: p.tan, mid: mix(p.building, p.skyBottom, night ? 0.35 : 0.5) };
  let defs = `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.skyTop}"/><stop offset="0.6" stop-color="${mix(p.skyTop, p.skyBottom, 0.6)}"/><stop offset="1" stop-color="${p.skyBottom}"/></linearGradient>`;
  defs += `<linearGradient id="${id}-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${glowColour}" stop-opacity="0"/><stop offset="1" stop-color="${glowColour}" stop-opacity="${phase === "day" ? 0.35 : 0.6}"/></linearGradient>`;
  defs += `<radialGradient id="${id}-halo"><stop offset="0" stop-color="${p.sun}" stop-opacity="0.75"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>`;
  defs += `<linearGradient id="${id}-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stop-color="${p.cloud}"/><stop offset="1" stop-color="${mix(p.cloud, p.skyTop, 0.35)}"/></linearGradient>`;
  for (const [c, col] of Object.entries(fills)) {
    defs += `<linearGradient id="${id}-${c}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${mix(col, "#ffffff", night ? 0.06 : 0.25)}"/><stop offset="0.55" stop-color="${col}"/><stop offset="1" stop-color="${mix(col, p.line, night ? 0.25 : 0.14)}"/></linearGradient>`;
  }
  defs += `<linearGradient id="${id}-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p.far, p.skyTop, 0.2)}"/><stop offset="1" stop-color="${mix(p.far, p.skyBottom, 0.3)}"/></linearGradient>`;
  defs += `<linearGradient id="${id}-mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.mountain}"/><stop offset="1" stop-color="${mix(p.mountain, p.skyBottom, 0.45)}"/></linearGradient>`;
  defs += `<linearGradient id="${id}-mtb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p.mountain, p.skyTop, 0.4)}"/><stop offset="1" stop-color="${mix(p.mountain, p.skyBottom, 0.7)}"/></linearGradient>`;
  defs += `<linearGradient id="${id}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p.water, p.skyBottom, 0.3)}"/><stop offset="1" stop-color="${mix(p.water, p.line, night ? 0.2 : 0.12)}"/></linearGradient>`;
  defs += `<filter id="${id}-wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  defs += `<filter id="${id}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>`;
  defs += `<filter id="${id}-ripple" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.01 0.22" numOctaves="2" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0.6"/></filter>`;
  defs += `<filter id="${id}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${night ? 0.22 : 0.16} 0"/></filter>`;
  defs += `<clipPath id="${id}-wclip"><rect x="0" y="${GROUND}" width="${W}" height="${H - GROUND}"/></clipPath>`;

  let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id}-sky)"/>`;
  s += `<rect x="0" y="90" width="${W}" height="${GROUND - 90}" fill="url(#${id}-glow)"/>`;

  const overcast = input.weather === "rain" || input.weather === "snow" || input.weather === "storm" || input.weather === "fog" || (input.weather === "cloudy" && input.cloudCover > 90);
  if (night && !overcast) {
    const stars = seeded(`${input.name}|stars`);
    for (let i = 0; i < Math.round((60 * W) / BASE); i++) {
      const x = (stars() * W).toFixed(0);
      const y = (stars() * 140).toFixed(0);
      const big = stars() < 0.12;
      s += big
        ? `<path class="star" d="M${x} ${+y - 4} L${+x + 1} ${+y - 1} L${+x + 4} ${y} L${+x + 1} ${+y + 1} L${x} ${+y + 4} L${+x - 1} ${+y + 1} L${+x - 4} ${y} L${+x - 1} ${+y - 1}Z"/>`
        : `<circle class="star" cx="${x}" cy="${y}" r="${(0.6 + stars() * 1.3).toFixed(1)}"/>`;
    }
  }

  const body = skyBody(input.minutes, input.sunrise, input.sunset);
  const bx = (70 + body.x * (W - 140)).toFixed(0);
  const by = (196 - body.height * 156).toFixed(0);
  if (!overcast) {
    s += `<circle cx="${bx}" cy="${by}" r="${body.kind === "sun" ? 70 : 46}" fill="url(#${id}-halo)"/>`;
    s += body.kind === "sun"
      ? `<g class="near" filter="url(#${id}-wob)"><circle class="sun" cx="${bx}" cy="${by}" r="22"/></g>`
      : `<g class="near" filter="url(#${id}-wob)"><path class="moon" d="M${+bx + 6} ${+by - 20} a20 20 0 1 0 15 35 a15.5 15.5 0 1 1 -15 -35Z"/></g>`;
  }

  const cloudCount = input.weather === "clear" ? (input.cloudCover > 20 ? 1 : 0) : input.weather === "cloudy" ? 2 + Math.round((input.cloudCover / 100) * 3) : 4;
  let clouds = "";
  for (let i = 0; i < cloudCount; i++) clouds += cloud(60 + wx() * (W - 200), 64 + wx() * 50, 1.1 + wx() * 1.1, id);
  if (clouds) s += `<g class="near thin${input.weather !== "clear" && input.weather !== "cloudy" ? " grey" : ""}" filter="url(#${id}-wob)">${clouds}</g>`;

  if (spec.mountains) s += `<g class="soft">${mountains(rng, (input.elevation ?? 0) > 1500 || spec.skyline === "low", W, id)}</g>`;
  s += `<g fill="url(#${id}-far)">${farSkyline(rng, spec.skyline, landmark, W)}</g>`;

  // Middle layer: lighter and finer, for depth.
  const clear = landmark ? ((spec.clear ?? [520, 680]).map((x) => x + off) as [number, number]) : undefined;
  if (spec.skyline !== "low") {
    const mid = buildings(midRng, spec.skyline === "tall" ? "mid" : "low", clear ? [clear[0] + 40, clear[1] - 40] : undefined, night, W, spec.skyline === "tall" ? 1.25 : 1, false);
    s += `<g class="midl">${mid.shapes.replace(/class="(b2|b|p|g|u|t)"/g, `class="mid" fill="url(#${id}-mid)"`)}</g>`;
  }

  // Front layer: the city itself, the landmark, trees and street lamps.
  const near = buildings(rng, spec.skyline, clear, night, W);
  let city = near.shapes;
  if (spec.trees || spec.skyline === "low") {
    for (let i = 0; i < Math.round((6 * W) / BASE); i++) {
      const x = Math.round(rng() * W);
      if (clear && x > clear[0] - 10 && x < clear[1] + 10) continue;
      city += rng() < 0.15 && spec.water ? palm(x, 60) : tree(x, 10 + Math.round(rng() * 6));
    }
  }
  if (landmark && spec.draw) city += off ? `<g transform="translate(${off} 0)">${spec.draw()}</g>` : spec.draw();
  const street = spec.water ? { shapes: "", glow: "" } : lamps(W, clear, night);
  city += street.shapes;
  city = city.replace(/class="(b2|b|p|g|u|t)"/g, (_m, c) => `class="${c}" fill="url(#${id}-${c})"`);
  s += `<g id="${id}-city" class="near" filter="url(#${id}-wob)">${city}</g>`;

  // Windows, glowing at night.
  if (night) s += `<g class="winglow" filter="url(#${id}-blur)">${near.windows.replace(/<rect class="w0"[^>]*\/>/g, "")}</g>`;
  s += `<g>${near.windows}</g>`;
  if (street.glow) s += `<g filter="url(#${id}-blur)">${street.glow}</g>`;

  if (spec.water) {
    s += `<rect x="0" y="${GROUND}" width="${W}" height="${H - GROUND}" fill="url(#${id}-water)" class="water"/>`;
    s += `<g clip-path="url(#${id}-wclip)" opacity="${night ? 0.45 : 0.3}" filter="url(#${id}-ripple)"><use href="#${id}-city" transform="matrix(1 0 0 -1 0 ${2 * GROUND})"/></g>`;
    s += `<path class="wave" d="${Array.from({ length: Math.ceil(W / 160) }, (_, i) => `M${30 + i * 160} ${i % 2 ? 230 : 222} q8 -4 16 0 t16 0`).join(" ")}"/>`;
  } else {
    s += `<rect class="ground" x="0" y="${GROUND}" width="${W}" height="${H - GROUND}"/><path class="kerb" d="M0 ${GROUND + 9} H${W}"/>`;
  }
  s += `<path class="groundline" d="M0 ${GROUND} H${W}"/>`;
  s += weatherLayer(wx, input.weather, W);
  s += `<rect x="0" y="0" width="${W}" height="${H}" filter="url(#${id}-grain)" class="grain"/>`;

  return { svg: `<defs>${defs}</defs>${s}`, phase, palette: p, hasLandmark: landmark };
}

function palette(phase: Phase): Palette {
  return PALETTES[phase];
}
