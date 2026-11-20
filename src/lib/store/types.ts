// What a trip looks like when saved in the browser.

import type { Activity, Category, QuizAnswers, WeatherTag } from "../packing/types";
import type { WeatherSummary } from "../weather/openMeteo";

export type CoverColour = "strawberry" | "matcha" | "hojicha";

export interface SavedStop {
  id: string;
  destination: string; // "Kyoto"
  country?: string; // "Japan"
  countryCode?: string; // "JP"
  latitude: number;
  longitude: number;
  /** IANA time zone, e.g. "Asia/Tokyo" (for the banner's local time) */
  timezone?: string;
  population?: number;
  elevation?: number;
  startDate: string;
  endDate: string;
  /** Packing tags from the weather (or picked by hand if the weather service was down). */
  weather: WeatherTag[];
  summary?: WeatherSummary;
  /** When the weather was last looked up (ISO time). */
  fetchedAt?: string;
}

export interface SavedItem {
  /** Stable key: the rule id for generated items, "custom-…" for ones you added. */
  key: string;
  ruleId: string | null;
  category: Category;
  name: string;
  quantity: number;
  /** What the rules suggested, so edits can be learned from. */
  suggestedQuantity?: number;
  note?: string;
  travelNote?: string;
  reasons: string[];
  shareable: boolean;
  packed: boolean;
  /** You changed the quantity by hand: weather refreshes won't touch it. */
  quantityEdited?: boolean;
  /** Added by the latest weather change. */
  isNew?: boolean;
  /** The latest weather change means you might not need this any more. */
  maybeNotNeeded?: boolean;
}

/** Shown at the top of a trip after the weather changed the list. */
export interface ChangeNote {
  at: string;
  why: string; // "The forecast for Tokyo now shows rain."
  added: string[];
  maybeNot: string[];
}

export interface SavedTrip {
  v: 1;
  id: string;
  cover: CoverColour;
  stops: SavedStop[];
  activities: Activity[];
  quiz: QuizAnswers;
  items: SavedItem[];
  /** Rule items you removed: they don't come back on refresh. */
  removedRuleIds: string[];
  /** Suggestions from past trips you said no to. */
  dismissedSuggestions: string[];
  change?: ChangeNote;
  /** Set when the trip is shared with friends. */
  group?: { token: string; memberId: string; name: string };
  /** Shareable items that moved to the group's shared list (not re-added to yours). */
  sharedRuleIds?: string[];
  /** Shared items you claimed and have packed (group item ids). */
  sharedPacked?: string[];
  createdAt: string;
  updatedAt: string;
}
