// Turns a trip's cities, activities, quiz and weather into its saved checklist,
// and refreshes that checklist when the weather changes.

import { generatePackingList } from "../packing/generate";
import { RULES } from "../packing/rules";
import type { PackingItem, TripInput, WeatherTag } from "../packing/types";
import { WEATHER_LABELS } from "../packing/types";
import { needsAdapter, plugNote } from "../places/facts";
import type { Learned } from "./learning";
import type { ChangeNote, SavedItem, SavedStop, SavedTrip } from "./types";

function toInput(trip: Pick<SavedTrip, "stops" | "activities" | "quiz">): TripInput {
  return {
    stops: trip.stops.map((s) => ({ destination: s.destination, startDate: s.startDate, endDate: s.endDate, weather: s.weather })),
    activities: trip.activities,
    quiz: trip.quiz,
  };
}

/** The rules' list for this trip, with destination-aware tweaks (adapter only if plugs differ). */
export function suggestedItems(trip: Pick<SavedTrip, "stops" | "activities" | "quiz">): PackingItem[] {
  const codes = trip.stops.map((s) => s.countryCode);
  const items = generatePackingList(toInput(trip)).groups.flatMap((g) => g.items);
  return items
    .filter((item) => item.id !== "adapter" || needsAdapter(codes))
    .map((item) => (item.id === "adapter" ? { ...item, note: plugNote(codes) ?? item.note } : item));
}

function fromSuggestion(item: PackingItem): SavedItem {
  return {
    key: item.id,
    ruleId: item.id,
    category: item.category,
    name: item.name,
    quantity: item.quantity,
    suggestedQuantity: item.quantity,
    ...(item.note ? { note: item.note } : {}),
    ...(item.travelNote ? { travelNote: item.travelNote } : {}),
    reasons: item.reasons,
    shareable: item.shareable,
    packed: false,
  };
}

/** The first checklist for a new trip, shaped by what you've done on past trips. */
export function buildItems(trip: Pick<SavedTrip, "stops" | "activities" | "quiz">, learned?: Learned): {
  items: SavedItem[];
  removedRuleIds: string[];
} {
  const removedRuleIds: string[] = [];
  const items: SavedItem[] = [];
  for (const s of suggestedItems(trip)) {
    if (learned?.usuallyRemoved.has(s.id)) {
      removedRuleIds.push(s.id);
      continue;
    }
    const item = fromSuggestion(s);
    const delta = learned?.quantityDelta.get(s.id);
    if (delta && item.quantity > 0) {
      item.quantity = Math.max(1, item.quantity + delta);
      item.quantityEdited = true;
    }
    items.push(item);
  }
  return { items, removedRuleIds };
}

function describeWeatherChange(before: SavedStop[], after: SavedStop[]): string {
  const changed = after.filter((s) => {
    const old = before.find((b) => b.id === s.id);
    return !old || old.weather.slice().sort().join() !== s.weather.slice().sort().join();
  });
  if (changed.length === 0) return "The weather changed.";
  const parts = changed.map((s) => {
    const old = before.find((b) => b.id === s.id);
    const gained = s.weather.filter((t) => !old?.weather.includes(t));
    const label = (t: WeatherTag) => WEATHER_LABELS[t].toLowerCase();
    return gained.length ? `${s.destination} now has ${gained.map(label).join(" and ")}` : `${s.destination} looks milder`;
  });
  return `The forecast changed: ${parts.join("; ")}.`;
}

/**
 * Refresh a trip's checklist after its weather (or details) changed.
 * New suggestions are added and flagged; items that no longer apply are kept but
 * flagged "you might not need this"; your ticks, edits and added items are untouched.
 */
export function refreshItems(trip: SavedTrip, newStops: SavedStop[], now: string): SavedTrip {
  const next = { ...trip, stops: newStops };
  const suggested = suggestedItems(next);
  const byRule = new Map(trip.items.filter((i) => i.ruleId).map((i) => [i.ruleId as string, i]));
  const suggestedIds = new Set(suggested.map((s) => s.id));

  const added: string[] = [];
  const maybeNot: string[] = [];
  const items: SavedItem[] = trip.items.map((item) => {
    if (!item.ruleId) return item;
    if (!suggestedIds.has(item.ruleId)) {
      if (!item.maybeNotNeeded && !item.packed) maybeNot.push(item.name);
      return { ...item, isNew: false, maybeNotNeeded: !item.packed };
    }
    const s = suggested.find((x) => x.id === item.ruleId)!;
    const quantity = item.quantityEdited ? item.quantity : s.quantity;
    return { ...item, quantity, suggestedQuantity: s.quantity, reasons: s.reasons, maybeNotNeeded: false, isNew: false };
  });
  for (const s of suggested) {
    if (byRule.has(s.id) || trip.removedRuleIds.includes(s.id)) continue;
    items.push({ ...fromSuggestion(s), isNew: true });
    added.push(s.name);
  }

  const change: ChangeNote | undefined =
    added.length || maybeNot.length ? { at: now, why: describeWeatherChange(trip.stops, newStops), added, maybeNot } : trip.change;
  return { ...next, items, change, updatedAt: now };
}

/** Rules that exist (used to drop stale ids from old saved trips). */
export const RULE_IDS = new Set(RULES.map((r) => r.id));
