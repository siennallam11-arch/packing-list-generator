import type { DoodleName } from "@/components/Doodle";
import { ACTIVITY_LABELS, type Activity, type QuizAnswers } from "./packing/types";

export interface QuizQuestion {
  key: keyof QuizAnswers;
  question: string;
  doodle: DoodleName;
  options: { label: string; value: QuizAnswers[keyof QuizAnswers] }[];
}

const yesNo = [
  { label: "Yes", value: true },
  { label: "Nope", value: false },
];

export const QUIZ: QuizQuestion[] = [
  {
    key: "packingStyle",
    question: "Do you overpack?",
    doodle: "suitcase",
    options: [
      { label: "I pack light", value: "light" },
      { label: "Just right", value: "normal" },
      { label: "I bring everything, just in case", value: "over" },
    ],
  },
  { key: "workout", question: "Will you work out?", doodle: "sock", options: yesNo },
  { key: "fancyDinner", question: "Any fancy dinners?", doodle: "suitcase", options: yesNo },
  {
    key: "laundry",
    question: "Laundry where you're staying?",
    doodle: "bottle",
    options: [
      { label: "Yes", value: true },
      { label: "Nope", value: false },
      { label: "Not sure", value: false },
    ],
  },
  { key: "working", question: "Working on this trip?", doodle: "plug", options: yesNo },
  { key: "international", question: "Leaving the country?", doodle: "passport", options: yesNo },
  { key: "carryOnOnly", question: "Carry-on only?", doodle: "backpack", options: yesNo },
];

export const ACTIVITY_ORDER: Activity[] = ["sightseeing", "nightlife", "hiking", "beach", "pool", "skiing", "camping", "wedding", "business"];
export { ACTIVITY_LABELS };
