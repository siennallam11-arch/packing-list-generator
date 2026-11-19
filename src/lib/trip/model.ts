// What a saved trip looks like. Every trip is a group trip, even when only one
// person is on it, so adding friends later needs no changes.
// These map 1:1 to database tables once we set up Supabase.

import type { Activity, Category, QuizAnswers, WeatherTag } from "../packing/types";
import type { WeatherSummary } from "../weather/openMeteo";

export interface Trip {
  id: string;
  /** Secret, unguessable part of the magic link: /t/<shareToken> */
  shareToken: string;
  name: string; // "Tokyo with the girls"
  activities: Activity[];
  createdAt: string;
}

/** One city on a trip, with its own dates and weather. */
export interface TripStop {
  id: string;
  tripId: string;
  position: number;
  destination: string; // "Kyoto"
  country?: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  /** Packing tags from the weather, or picked by hand if the weather service is down. */
  weather: WeatherTag[];
  /** Latest weather lookup, used for the blurb under the city. */
  weatherSummary?: WeatherSummary;
}

/** A person on the trip. No account: they just pick their name on first visit. */
export interface Member {
  id: string;
  tripId: string;
  displayName: string;
  /** Each person answers the quiz for themselves. */
  quiz: QuizAnswers;
}

export interface Item {
  id: string;
  tripId: string;
  /** Whose list it's on. null = the shared list (speaker, hairdryer...). */
  memberId: string | null;
  /** Rule that generated it, or null if someone added it by hand. */
  ruleId: string | null;
  category: Category;
  name: string;
  quantity: number;
  note?: string;
  packed: boolean;
  /** Shared items: who said "I'll bring it". */
  claimedBy: string | null;
  position: number;
}

/** A short message on a shared item: "I have a travel one!" */
export interface ItemComment {
  id: string;
  itemId: string;
  memberId: string;
  body: string;
  createdAt: string;
}
