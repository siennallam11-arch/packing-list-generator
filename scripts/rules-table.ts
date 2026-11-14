// Writes docs/packing-rules.md from src/lib/packing/rules.ts.
// Run with: npm run rules

import { writeFileSync } from "node:fs";
import { LAUNDRY_CYCLE_DAYS, MAX_PACKING_DAYS } from "../src/lib/packing/generate";
import { RULES, type Condition, type Quantity } from "../src/lib/packing/rules";
import { ACTIVITY_LABELS, CATEGORY_LABELS, CATEGORY_ORDER, QUIZ_LABELS, WEATHER_LABELS } from "../src/lib/packing/types";

const describe = (c: Condition) =>
  "always" in c ? "Always" : "activity" in c ? ACTIVITY_LABELS[c.activity] : "weather" in c ? WEATHER_LABELS[c.weather] : QUIZ_LABELS[c.quiz];

const qtyText = (q: Quantity | undefined) => {
  if (q === undefined) return "1";
  if (typeof q === "number") return String(q);
  if (Array.isArray(q)) return q[0] === q[1] && q[1] === q[2] ? String(q[0]) : `${q[0]} / ${q[1]} / ${q[2]}`;
  return { perDay: "1 per day", perDayPlusSpare: "1 per day + spare", everyFewDays: "1 per ~3 days" }[q];
};

const lines = [
  "# Packing rules",
  "",
  "_Generated from `src/lib/packing/rules.ts` by `npm run rules`. Don't edit by hand._",
  "",
  "## How quantities work",
  "",
  `- **Packing days** = days of the trip, capped at ${LAUNDRY_CYCLE_DAYS} if you have laundry and ${MAX_PACKING_DAYS} if you don't.`,
  "- **1 per day**: light packer ~70% of packing days, normal = packing days, overpacker = +1.",
  "- **1 per day + spare**: light = packing days, normal = +1, overpacker = +2.",
  "- **1 per ~3 days**: light ÷4, normal ÷3, overpacker ÷2 (rounded up, at least 1).",
  "- **a / b / c**: light / normal / overpacker.",
  "- **Overpackers only**: \"just in case\" items, skipped unless you say you overpack.",
  "- **Shared**: on group trips these go on the shared list, so only one person brings them.",
  "",
  "Example: 6 days, normal packer, no laundry → 6 tops, 7 underwear, 7 socks, 2 pants.",
  "",
];

for (const category of CATEGORY_ORDER) {
  lines.push(`## ${CATEGORY_LABELS[category]}`, "", "| Item | Added when | How many | Notes |", "|---|---|---|---|");
  for (const r of RULES.filter((r) => r.category === category)) {
    const when = r.when.map(describe).join(" or ") + (r.unless ? ` (not if ${r.unless.map(describe).join(" or ")})` : "");
    const notes = [
      r.shareable && "Shared",
      r.extraOnly && "Overpackers only",
      r.note,
      r.carryOnNote && `Carry-on: ${r.carryOnNote.toLowerCase()}`,
    ].filter(Boolean).join(" · ");
    lines.push(`| ${r.name} | ${when} | ${qtyText(r.qty)} | ${notes} |`);
  }
  lines.push("");
}

writeFileSync("docs/packing-rules.md", lines.join("\n"));
console.log(`Wrote docs/packing-rules.md (${RULES.length} items)`);
