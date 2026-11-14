import { RULES, STYLE_INDEX, type Condition, type Quantity, type Rule } from "./rules";
import { tripLength } from "./trip";
import {
  ACTIVITY_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  QUIZ_LABELS,
  WEATHER_LABELS,
  type PackingItem,
  type PackingList,
  type TripInput,
} from "./types";

/** With laundry you re-wear after this many days. */
export const LAUNDRY_CYCLE_DAYS = 5;
/** Without laundry, nobody needs more than this many of anything. */
export const MAX_PACKING_DAYS = 10;

function matches(condition: Condition, trip: TripInput): boolean {
  if ("always" in condition) return true;
  if ("activity" in condition) return trip.activities.includes(condition.activity);
  if ("weather" in condition) return trip.weather.includes(condition.weather);
  return trip.quiz[condition.quiz];
}

function reasonFor(condition: Condition): string | null {
  if ("always" in condition) return null;
  if ("activity" in condition) return ACTIVITY_LABELS[condition.activity];
  if ("weather" in condition) return WEATHER_LABELS[condition.weather];
  return QUIZ_LABELS[condition.quiz];
}

/** Days' worth of clothes to pack, before packing-style adjustments. */
export function packingDays(days: number, laundry: boolean): number {
  return Math.min(days, laundry ? LAUNDRY_CYCLE_DAYS : MAX_PACKING_DAYS);
}

export function resolveQuantity(qty: Quantity | undefined, trip: TripInput, days: number): number {
  const style = STYLE_INDEX[trip.quiz.packingStyle];
  const d = packingDays(days, trip.quiz.laundry);

  if (qty === undefined) return 1;
  if (typeof qty === "number") return qty;
  if (Array.isArray(qty)) return qty[style];

  switch (qty) {
    case "perDay":
      return [Math.ceil(d * 0.7), d, d + 1][style];
    case "perDayPlusSpare":
      return [d, d + 1, d + 2][style];
    case "everyFewDays":
      return Math.max(1, [Math.ceil(d / 4), Math.ceil(d / 3), Math.ceil(d / 2)][style]);
  }
}

function buildItem(rule: Rule, trip: TripInput, days: number): PackingItem | null {
  if (rule.extraOnly && trip.quiz.packingStyle !== "over") return null;

  const matched = rule.when.filter((c) => matches(c, trip));
  if (matched.length === 0) return null;
  if (rule.unless?.some((c) => matches(c, trip))) return null;

  const reasons = matched.map(reasonFor).filter((r): r is string => r !== null);
  const note = trip.quiz.carryOnOnly && rule.carryOnNote ? rule.carryOnNote : rule.note;

  return {
    id: rule.id,
    name: rule.name,
    category: rule.category,
    quantity: resolveQuantity(rule.qty, trip, days),
    ...(note ? { note } : {}),
    shareable: rule.shareable ?? false,
    reasons,
  };
}

/** Turn a trip + quiz answers + weather into a checklist grouped by category. */
export function generatePackingList(trip: TripInput, rules: Rule[] = RULES): PackingList {
  const { nights, days } = tripLength(trip.startDate, trip.endDate);

  const items = rules
    .map((rule) => buildItem(rule, trip, days))
    .filter((item): item is PackingItem => item !== null);

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return { nights, days, groups };
}
