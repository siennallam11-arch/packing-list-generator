// Looks up (and later refreshes) each city's weather, then updates the list.

import { daysBetween } from "../packing/trip";
import { getStopWeather } from "../weather/openMeteo";
import { refreshItems } from "./build";
import type { SavedStop, SavedTrip } from "./types";

/** Look again after this long, so a changed forecast shows up. */
const REFRESH_AFTER_MS = 3 * 60 * 60 * 1000;

export function stopNeedsWeather(stop: SavedStop, today: string, now = Date.now()): boolean {
  if (daysBetween(today, stop.endDate) < 0) return false; // trip's over
  if (!stop.summary || !stop.fetchedAt) return true;
  if (stop.summary.source === "last-year" && stop.summary.forecastFrom && daysBetween(stop.summary.forecastFrom, today) >= 0) return true;
  return now - Date.parse(stop.fetchedAt) > REFRESH_AFTER_MS;
}

export async function withWeather(stop: SavedStop, today: string, fetchFn: typeof fetch = fetch): Promise<SavedStop> {
  const summary = await getStopWeather(stop, stop.startDate, stop.endDate, today, fetchFn);
  return { ...stop, summary, weather: summary.tags, fetchedAt: new Date().toISOString() };
}

/**
 * Refresh any stale weather. Returns the updated trip, or null if nothing changed.
 * Failures (offline, service down) keep the old weather.
 */
export async function refreshTripWeather(trip: SavedTrip, today: string, fetchFn: typeof fetch = fetch): Promise<SavedTrip | null> {
  const stale = trip.stops.filter((s) => stopNeedsWeather(s, today));
  if (stale.length === 0) return null;
  const stops = await Promise.all(
    trip.stops.map(async (s) => {
      if (!stale.includes(s)) return s;
      try {
        return await withWeather(s, today, fetchFn);
      } catch {
        return s;
      }
    }),
  );
  if (stops.every((s, i) => s === trip.stops[i])) return null;
  return refreshItems(trip, stops, new Date().toISOString());
}
