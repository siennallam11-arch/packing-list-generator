// Small, pure edits to a saved trip. Each returns a new trip.

import type { Category } from "../packing/types";
import type { CoverColour, SavedItem, SavedTrip } from "./types";

const touch = (trip: SavedTrip, patch: Partial<SavedTrip>, now = new Date().toISOString()): SavedTrip => ({
  ...trip,
  ...patch,
  updatedAt: now,
});

const mapItem = (trip: SavedTrip, key: string, fn: (i: SavedItem) => SavedItem): SavedTrip =>
  touch(trip, { items: trip.items.map((i) => (i.key === key ? fn(i) : i)) });

export const togglePacked = (trip: SavedTrip, key: string) =>
  mapItem(trip, key, (i) => ({ ...i, packed: !i.packed, isNew: false }));

export const setQuantity = (trip: SavedTrip, key: string, quantity: number) =>
  mapItem(trip, key, (i) => ({ ...i, quantity: Math.max(1, Math.min(99, Math.round(quantity))), quantityEdited: true }));

export const renameItem = (trip: SavedTrip, key: string, name: string) =>
  mapItem(trip, key, (i) => ({ ...i, name: name.trim() || i.name }));

export function removeItem(trip: SavedTrip, key: string): SavedTrip {
  const item = trip.items.find((i) => i.key === key);
  if (!item) return trip;
  return touch(trip, {
    items: trip.items.filter((i) => i.key !== key),
    removedRuleIds: item.ruleId && !trip.removedRuleIds.includes(item.ruleId) ? [...trip.removedRuleIds, item.ruleId] : trip.removedRuleIds,
  });
}

export function addItem(trip: SavedTrip, name: string, category: Category, quantity = 1): SavedTrip {
  const clean = name.trim();
  if (!clean) return trip;
  const key = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const item: SavedItem = { key, ruleId: null, category, name: clean, quantity, reasons: [], shareable: false, packed: false };
  return touch(trip, { items: [...trip.items, item] });
}

export const setCover = (trip: SavedTrip, cover: CoverColour) => touch(trip, { cover });

export const dismissChange = (trip: SavedTrip) =>
  touch(trip, { change: undefined, items: trip.items.map((i) => ({ ...i, isNew: false })) });

export const dismissSuggestion = (trip: SavedTrip, name: string) =>
  touch(trip, { dismissedSuggestions: [...trip.dismissedSuggestions, name] });

export const packedCount = (trip: SavedTrip) => trip.items.filter((i) => i.packed).length;
