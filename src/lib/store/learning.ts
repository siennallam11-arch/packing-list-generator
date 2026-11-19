// Learns from your past trips: what you always remove, what you always add by
// hand, and quantities you always change.

import type { Category } from "../packing/types";
import type { SavedTrip } from "./types";

/** How many past trips a habit needs before Caboodle acts on it. */
export const HABIT_TRIPS = 2;

export interface PastSuggestion {
  name: string;
  category: Category;
  trips: number;
}

export interface Learned {
  /** Rule items you removed on at least HABIT_TRIPS trips. */
  usuallyRemoved: Set<string>;
  /** Rule id → how many more (or fewer) you usually bring. */
  quantityDelta: Map<string, number>;
  /** Things you added by hand on at least HABIT_TRIPS trips. */
  usuallyAdded: PastSuggestion[];
}

export function learnFrom(pastTrips: SavedTrip[]): Learned {
  const removed = new Map<string, number>();
  const deltas = new Map<string, number[]>();
  const added = new Map<string, PastSuggestion>();

  for (const trip of pastTrips) {
    for (const id of new Set(trip.removedRuleIds)) removed.set(id, (removed.get(id) ?? 0) + 1);
    const seen = new Set<string>();
    for (const item of trip.items) {
      if (!item.ruleId) {
        const key = item.name.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const prev = added.get(key);
        added.set(key, { name: prev?.name ?? item.name.trim(), category: prev?.category ?? item.category, trips: (prev?.trips ?? 0) + 1 });
      } else if (item.quantityEdited && item.suggestedQuantity !== undefined && item.quantity !== item.suggestedQuantity) {
        const list = deltas.get(item.ruleId) ?? [];
        list.push(item.quantity - item.suggestedQuantity);
        deltas.set(item.ruleId, list);
      }
    }
  }

  const quantityDelta = new Map<string, number>();
  for (const [id, list] of deltas) {
    if (list.length < HABIT_TRIPS) continue;
    const allUp = list.every((d) => d > 0);
    const allDown = list.every((d) => d < 0);
    if (!allUp && !allDown) continue;
    quantityDelta.set(id, Math.round(list.reduce((a, b) => a + b, 0) / list.length));
  }

  return {
    usuallyRemoved: new Set([...removed].filter(([, n]) => n >= HABIT_TRIPS).map(([id]) => id)),
    quantityDelta,
    usuallyAdded: [...added.values()].filter((s) => s.trips >= HABIT_TRIPS).sort((a, b) => b.trips - a.trips),
  };
}

/** "From your past trips" suggestions not already on (or dismissed from) this trip. */
export function suggestionsFor(trip: SavedTrip, learned: Learned): PastSuggestion[] {
  const onList = new Set(trip.items.map((i) => i.name.trim().toLowerCase()));
  const dismissed = new Set(trip.dismissedSuggestions.map((n) => n.toLowerCase()));
  return learned.usuallyAdded.filter((s) => !onList.has(s.name.toLowerCase()) && !dismissed.has(s.name.toLowerCase()));
}
