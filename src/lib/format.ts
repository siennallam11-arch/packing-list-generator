import { daysBetween, parseDate } from "./packing/trip";
import type { WeatherTag } from "./packing/types";
import type { SavedStop } from "./store/types";
import type { DoodleName } from "../components/Doodle";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-10" → "Dec 10" */
export function fmtDay(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "Dec 10 – Dec 15", with years when they differ from each other */
export function fmtRange(start: string, end: string): string {
  const y1 = start.slice(0, 4);
  const y2 = end.slice(0, 4);
  return y1 === y2 ? `${fmtDay(start)} – ${fmtDay(end)}` : `${fmtDay(start)}, ${y1} – ${fmtDay(end)}, ${y2}`;
}

/** "Jun 2026" */
export function fmtMonth(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "tokyo + kyoto" */
export function tripTitle(stops: Pick<SavedStop, "destination">[]): string {
  return stops.map((s) => s.destination.toLowerCase()).join(" + ") || "new trip";
}

/** "in 21 days", "tomorrow", "today", "on now" */
export function untilText(start: string, end: string, today: string): string {
  const d = daysBetween(today, start);
  if (d > 1) return `in ${d} days`;
  if (d === 1) return "tomorrow";
  if (d === 0) return "today";
  return daysBetween(today, end) >= 0 ? "on now" : "done";
}

export function weatherDoodle(tags: WeatherTag[]): DoodleName {
  if (tags.includes("snow") || tags.includes("freezing")) return "snow";
  if (tags.includes("rain")) return "umbrella";
  if (tags.includes("warm") || tags.includes("hot")) return "sun";
  if (tags.includes("cold")) return "snow";
  return "suitcase";
}
