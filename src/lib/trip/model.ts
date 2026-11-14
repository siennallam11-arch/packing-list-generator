// What a saved trip looks like. Every trip is a group trip, even when only one
// person is on it, so adding friends later needs no changes.
// These map 1:1 to database tables once we set up Supabase.

import type { Activity, Category, QuizAnswers, WeatherTag } from "../packing/types";

export interface Trip {
  id: string;
  /** Secret, unguessable part of the magic link: /t/<shareToken> */
  shareToken: string;
  name: string; // "Tokyo with the girls"
  destination: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  activities: Activity[];
  weather: WeatherTag[];
  createdAt: string;
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
