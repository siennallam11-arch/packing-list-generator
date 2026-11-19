// The banner's sky: what time of day it is in the city, and how that looks.

export type Phase = "night" | "dawn" | "day" | "dusk";
export type Weather = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";

export interface Palette {
  skyTop: string;
  skyBottom: string;
  building: string;
  building2: string;
  far: string;
  window: string;
  line: string;
  ground: string;
  water: string;
  cloud: string;
  cloudGrey: string;
  mountain: string;
  sun: string;
  pink: string;
  green: string;
  blue: string;
  tan: string;
}

export const PALETTES: Record<Phase, Palette> = {
  day: {
    skyTop: "#8ccbee", skyBottom: "#e3f3fb", building: "#ffffff", building2: "#eef0f2", far: "#c6e2f2",
    window: "#cfe3f3", line: "#222020", ground: "#eef3e6", water: "#9fd0e8", cloud: "#ffffff", cloudGrey: "#dfe3ea", mountain: "#bcd6c6", sun: "#fff1c4",
    pink: "#f6c4ca", green: "#bfd9a6", blue: "#c5e8e4", tan: "#d9b79c",
  },
  dawn: {
    skyTop: "#8f9bd0", skyBottom: "#fde3c4", building: "#fdf3ec", building2: "#eedfd6", far: "#e7c3c4",
    window: "#f5e1b8", line: "#222020", ground: "#efe3d6", water: "#c9d6ee", cloud: "#fff4ee", cloudGrey: "#e2d6dc", mountain: "#d9b9bf", sun: "#ffd59a",
    pink: "#f3b8be", green: "#b9cf9f", blue: "#bcdcd8", tan: "#d4b096",
  },
  dusk: {
    skyTop: "#5e5a9c", skyBottom: "#fbc89a", building: "#fbe9e0", building2: "#ead2c8", far: "#c48a9a",
    window: "#f8d78f", line: "#222020", ground: "#e4c9bd", water: "#a98fb3", cloud: "#f6d0c4", cloudGrey: "#c9b3bd", mountain: "#a7829c", sun: "#ffc98a",
    pink: "#efa9b2", green: "#a9bf8f", blue: "#a9cac6", tan: "#c9a086",
  },
  night: {
    skyTop: "#1f2347", skyBottom: "#474a7a", building: "#3a3852", building2: "#2f2d45", far: "#2c2d50",
    window: "#f5d58a", line: "#0f0e17", ground: "#2a2838", water: "#2c3560", cloud: "#5b5d86", cloudGrey: "#4a4c70", mountain: "#34355c", sun: "#fdf6e3",
    pink: "#8f5f6e", green: "#4f6b48", blue: "#4d6f82", tan: "#6e5848",
  },
};

/** Which part of the day it is, given local minutes and today's sunrise/sunset. */
export function phaseAt(minutes: number, sunrise: number, sunset: number): Phase {
  if (minutes < sunrise - 40 || minutes > sunset + 40) return "night";
  if (minutes < sunrise + 50) return "dawn";
  if (minutes > sunset - 60) return "dusk";
  return "day";
}

/** Where the sun (by day) or moon (by night) sits, as 0–1 across the sky and 0–1 up. */
export function skyBody(minutes: number, sunrise: number, sunset: number): { kind: "sun" | "moon"; x: number; height: number } {
  const dayLength = Math.max(1, sunset - sunrise);
  if (minutes >= sunrise - 20 && minutes <= sunset + 20) {
    const t = Math.min(1, Math.max(0, (minutes - sunrise) / dayLength));
    return { kind: "sun", x: t, height: Math.sin(Math.PI * t) };
  }
  const nightLength = 1440 - dayLength;
  const sinceSunset = (minutes - sunset + 1440) % 1440;
  const t = Math.min(1, Math.max(0, sinceSunset / nightLength));
  return { kind: "moon", x: t, height: Math.sin(Math.PI * t) };
}

/** WMO weather code → what to draw. */
export function weatherOf(code: number, cloudCover = 0): Weather {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2 || cloudCover >= 50) return "cloudy";
  return "clear";
}

/** Local minutes past midnight in a time zone (falls back to the viewer's own clock). */
export function localMinutesIn(timezone: string | undefined, now = new Date()): number {
  try {
    if (timezone) {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
      const h = Number(parts.find((p) => p.type === "hour")?.value);
      const m = Number(parts.find((p) => p.type === "minute")?.value);
      if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
    }
  } catch {
    // unknown zone: fall through
  }
  return now.getHours() * 60 + now.getMinutes();
}

/** "7:42 pm" */
export function clockText(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = String(minutes % 60).padStart(2, "0");
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? "am" : "pm"}`;
}

/** A small, repeatable random sequence: the same city always gets the same skyline. */
export function seeded(seedText: string): () => number {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** CSS custom properties the banner's shapes are coloured with. */
export function paletteVars(p: Palette): Record<string, string> {
  return {
    "--bf": p.building, "--bf2": p.building2, "--bfar": p.far, "--bw": p.window, "--bl": p.line, "--bground": p.ground,
    "--bwater": p.water, "--bcl": p.cloud, "--bclg": p.cloudGrey, "--bmt": p.mountain, "--bsun": p.sun,
    "--bp": p.pink, "--bg": p.green, "--bu": p.blue, "--bt": p.tan,
  };
}
