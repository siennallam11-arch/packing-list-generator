import type { Stop, WeatherTag } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse "YYYY-MM-DD" as a calendar date (UTC midnight), ignoring time zones. */
export function parseDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date "${iso}", expected YYYY-MM-DD`);
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new Error(`Invalid date "${iso}"`);
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIsoDate(new Date(parseDate(iso).getTime() + days * DAY_MS));
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / DAY_MS);
}

/**
 * Dec 10 → Dec 15 is 5 nights and 6 days. A same-day trip is 0 nights, 1 day.
 */
export function tripLength(startDate: string, endDate: string): { nights: number; days: number } {
  const nights = daysBetween(startDate, endDate);
  if (nights < 0) throw new Error("The trip ends before it starts");
  return { nights, days: nights + 1 };
}

/** "5 nights · 6 days" */
export function formatTripLength(nights: number, days: number): string {
  const n = `${nights} ${nights === 1 ? "night" : "nights"}`;
  const d = `${days} ${days === 1 ? "day" : "days"}`;
  return `${n} · ${d}`;
}


/** First day to last day across all cities. */
export function tripDates(stops: Stop[]): { startDate: string; endDate: string } {
  if (stops.length === 0) throw new Error("A trip needs at least one city");
  for (const stop of stops) tripLength(stop.startDate, stop.endDate); // validates each stop
  const starts = stops.map((s) => s.startDate).sort();
  const ends = stops.map((s) => s.endDate).sort();
  return { startDate: starts[0], endDate: ends[ends.length - 1] };
}

/** Weather for packing: every condition you'll meet in any city. */
export function tripWeather(stops: Stop[]): WeatherTag[] {
  return [...new Set(stops.flatMap((s) => s.weather))];
}

/** "Tokyo + Kyoto" */
export function tripName(stops: Stop[]): string {
  return stops.map((s) => s.destination).join(" + ");
}

/** The checklist shows a quantity only when it's more than one. */
export function showQuantity(quantity: number): boolean {
  return quantity > 1;
}
