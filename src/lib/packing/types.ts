// Shared types for the packing list generator.

export type Category =
  | "documents"
  | "clothes"
  | "toiletries"
  | "tech"
  | "gear"
  | "extras";

export const CATEGORY_LABELS: Record<Category, string> = {
  documents: "Documents",
  clothes: "Clothes",
  toiletries: "Toiletries",
  tech: "Tech",
  gear: "Activity gear",
  extras: "Odds & ends",
};

/** Order the categories appear on the checklist. */
export const CATEGORY_ORDER: Category[] = [
  "documents",
  "clothes",
  "toiletries",
  "tech",
  "gear",
  "extras",
];

export type Activity =
  | "beach"
  | "pool"
  | "skiing"
  | "hiking"
  | "camping"
  | "wedding"
  | "business"
  | "nightlife"
  | "sightseeing";

export const ACTIVITY_LABELS: Record<Activity, string> = {
  beach: "Beach",
  pool: "Pool",
  skiing: "Skiing / snowboarding",
  hiking: "Hiking",
  camping: "Camping",
  wedding: "Wedding",
  business: "Work meetings",
  nightlife: "Nights out",
  sightseeing: "Sightseeing",
};

/**
 * Weather tags are derived from the forecast (see lib/weather) or picked by
 * hand when the trip is too far away for a forecast. Several can apply at once:
 * a 2°C–9°C week is "freezing", "cold" and "cool".
 */
export type WeatherTag = "freezing" | "cold" | "cool" | "warm" | "hot" | "rain" | "snow";

export const WEATHER_LABELS: Record<WeatherTag, string> = {
  freezing: "Freezing temperatures",
  cold: "Cold weather",
  cool: "Cool evenings",
  warm: "Warm days",
  hot: "Hot days",
  rain: "Rain in the forecast",
  snow: "Snow in the forecast",
};

export type PackingStyle = "light" | "normal" | "over";

/** Answers to the quiz ("do you overpack?", "will you work out?", ...). */
export interface QuizAnswers {
  packingStyle: PackingStyle;
  workout: boolean;
  fancyDinner: boolean;
  laundry: boolean;
  working: boolean;
  international: boolean;
  carryOnOnly: boolean;
}

export type QuizFlag = Exclude<keyof QuizAnswers, "packingStyle">;

export const QUIZ_LABELS: Record<QuizFlag, string> = {
  workout: "Working out",
  fancyDinner: "Fancy dinner",
  laundry: "Laundry access",
  working: "Working on the trip",
  international: "Leaving the country",
  carryOnOnly: "Carry-on only",
};

export const DEFAULT_QUIZ: QuizAnswers = {
  packingStyle: "normal",
  workout: false,
  fancyDinner: false,
  laundry: false,
  working: false,
  international: false,
  carryOnOnly: false,
};

export interface TripInput {
  destination: string;
  /** ISO date, e.g. "2026-12-10" */
  startDate: string;
  /** ISO date, e.g. "2026-12-15" */
  endDate: string;
  activities: Activity[];
  weather: WeatherTag[];
  quiz: QuizAnswers;
}

export interface PackingItem {
  /** Stable id from the rule that produced it, so lists can be regenerated. */
  id: string;
  name: string;
  category: Category;
  quantity: number;
  note?: string;
  /** Could be shared by the group (hairdryer, speaker, sunscreen...). */
  shareable: boolean;
  /** Human-readable reasons this item is on the list, e.g. ["Skiing"]. */
  reasons: string[];
}

export interface PackingGroup {
  category: Category;
  label: string;
  items: PackingItem[];
}

export interface PackingList {
  nights: number;
  days: number;
  groups: PackingGroup[];
}
