// Saves trips in this browser (localStorage). Every read and write is guarded:
// private windows and blocked storage just mean nothing is remembered.

import type { SavedTrip } from "./types";

const KEY = "caboodle:trips:v1";

export function loadTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { trips?: SavedTrip[] };
    return Array.isArray(data.trips) ? data.trips.filter((t) => t && t.v === 1 && t.id) : [];
  } catch {
    return [];
  }
}

function saveAll(trips: SavedTrip[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ trips }));
    return true;
  } catch {
    return false;
  }
}

export function getTrip(id: string): SavedTrip | undefined {
  return loadTrips().find((t) => t.id === id);
}

export function saveTrip(trip: SavedTrip): boolean {
  const trips = loadTrips();
  const i = trips.findIndex((t) => t.id === trip.id);
  if (i >= 0) trips[i] = trip;
  else trips.push(trip);
  return saveAll(trips);
}

export function deleteTrip(id: string): boolean {
  return saveAll(loadTrips().filter((t) => t.id !== id));
}

export function newTripId(): string {
  const words = ["plum", "fox", "kiwi", "fig", "owl", "pear", "moss", "wren", "lark", "bean", "yuzu", "mint"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Today's date in the viewer's own time zone, "YYYY-MM-DD". */
export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
