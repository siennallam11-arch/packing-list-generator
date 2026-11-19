import type { Activity, Category, PackingStyle, QuizFlag, WeatherTag } from "./types";

/**
 * A condition that adds an item to the list.
 * An item is added when ANY of its `when` conditions match,
 * unless ANY of its `unless` conditions match.
 */
export type Condition =
  | { always: true }
  | { activity: Activity }
  | { weather: WeatherTag }
  | { quiz: QuizFlag };

/**
 * How many to pack.
 * - a number: always that many
 * - [light, normal, over]: depends on packing style
 * - "perDay": one per day (fewer for light packers, a spare for overpackers)
 * - "perDayPlusSpare": one per day plus a spare (underwear, socks)
 * - "everyFewDays": re-wearable things like pants (one per ~3 days)
 *
 * The per-day formulas count "packing days": trip days, capped at 5 if you
 * have laundry and at 10 if you don't. See generate.ts.
 */
export type Quantity =
  | number
  | [light: number, normal: number, over: number]
  | "perDay"
  | "perDayPlusSpare"
  | "everyFewDays";

export interface Rule {
  id: string;
  name: string;
  category: Category;
  when: Condition[];
  unless?: Condition[];
  qty?: Quantity;
  /** Shown under the item name. */
  note?: string;
  /** An airline/security rule worth knowing, shown on every trip ("Can't go in checked bags"). */
  travelNote?: string;
  /** Could be shared by a group (goes on the shared list on group trips). */
  shareable?: boolean;
  /** "Just in case" items, only added for overpackers. */
  extraOnly?: boolean;
}

// Short helpers so the table below stays readable.
const always: Condition = { always: true };
const act = (activity: Activity): Condition => ({ activity });
const wx = (weather: WeatherTag): Condition => ({ weather });
const quiz = (flag: QuizFlag): Condition => ({ quiz: flag });

const LIQUID = "3.4 fl oz or less in carry-ons";

export const RULES: Rule[] = [
  // ── Documents ────────────────────────────────────────────────
  { id: "wallet", name: "Wallet & cards", category: "documents", when: [always] },
  { id: "id", name: "ID / driver's license", category: "documents", when: [always] },
  { id: "tickets", name: "Tickets & boarding passes", category: "documents", when: [always] },
  { id: "bookings", name: "Hotel & booking confirmations", category: "documents", when: [always] },
  { id: "passport", name: "Passport", category: "documents", when: [quiz("international")], note: "Check it's valid for 6+ months" },
  { id: "visa", name: "Visa / entry documents", category: "documents", when: [quiz("international")], note: "Check if you need one" },
  { id: "insurance", name: "Travel insurance details", category: "documents", when: [quiz("international")] },
  { id: "cash", name: "Some local cash", category: "documents", when: [quiz("international")] },
  { id: "ski-pass", name: "Ski pass / rental booking", category: "documents", when: [act("skiing")] },
  { id: "business-cards", name: "Business cards", category: "documents", when: [act("business")] },

  // ── Clothes ──────────────────────────────────────────────────
  { id: "tops", name: "T-shirts / tops", category: "clothes", when: [always], qty: "perDay" },
  { id: "underwear", name: "Underwear", category: "clothes", when: [always], qty: "perDayPlusSpare" },
  { id: "socks", name: "Socks", category: "clothes", when: [always], qty: "perDayPlusSpare" },
  { id: "bottoms", name: "Pants / jeans", category: "clothes", when: [always], qty: "everyFewDays" },
  { id: "shorts", name: "Shorts / skirts", category: "clothes", when: [wx("warm")], qty: "everyFewDays" },
  { id: "pajamas", name: "Pajamas", category: "clothes", when: [always], qty: [1, 1, 2] },
  { id: "sweater", name: "Sweater / hoodie", category: "clothes", when: [always], qty: [1, 1, 2], note: "Planes are cold" },
  { id: "light-jacket", name: "Light jacket", category: "clothes", when: [wx("cool")], unless: [wx("cold")] },
  { id: "warm-coat", name: "Warm coat", category: "clothes", when: [wx("cold")] },
  { id: "thermals", name: "Thermal base layers", category: "clothes", when: [wx("freezing"), act("skiing")], qty: [1, 2, 2] },
  { id: "beanie", name: "Beanie", category: "clothes", when: [wx("freezing"), act("skiing")] },
  { id: "gloves", name: "Gloves", category: "clothes", when: [wx("freezing")] },
  { id: "scarf", name: "Scarf", category: "clothes", when: [wx("freezing")] },
  { id: "rain-jacket", name: "Rain jacket", category: "clothes", when: [wx("rain"), act("hiking"), act("camping")] },
  { id: "walking-shoes", name: "Comfy walking shoes", category: "clothes", when: [always] },
  { id: "sandals", name: "Sandals / flip-flops", category: "clothes", when: [wx("hot"), act("beach"), act("pool")] },
  { id: "swimsuit", name: "Swimsuit", category: "clothes", when: [act("beach"), act("pool")], qty: [1, 1, 2] },
  { id: "cover-up", name: "Beach cover-up", category: "clothes", when: [act("beach")], extraOnly: true },
  { id: "sun-hat", name: "Sun hat / cap", category: "clothes", when: [wx("hot"), act("beach"), act("hiking")] },
  { id: "workout-clothes", name: "Workout outfits", category: "clothes", when: [quiz("workout")], qty: "everyFewDays" },
  { id: "sneakers", name: "Workout sneakers", category: "clothes", when: [quiz("workout")] },
  { id: "dressy-outfit", name: "Dressy outfit", category: "clothes", when: [quiz("fancyDinner"), act("nightlife")] },
  { id: "dress-shoes", name: "Dress shoes", category: "clothes", when: [quiz("fancyDinner"), act("nightlife"), act("wedding"), act("business")] },
  { id: "wedding-outfit", name: "Wedding outfit", category: "clothes", when: [act("wedding")], note: "Check the dress code" },
  { id: "work-outfits", name: "Work outfits", category: "clothes", when: [act("business")], qty: "everyFewDays" },
  { id: "hiking-boots", name: "Hiking boots", category: "clothes", when: [act("hiking")] },
  { id: "hiking-socks", name: "Hiking socks", category: "clothes", when: [act("hiking")], qty: 2 },
  { id: "ski-wear", name: "Ski jacket & pants", category: "clothes", when: [act("skiing")] },
  { id: "ski-socks", name: "Ski socks", category: "clothes", when: [act("skiing")], qty: [2, 2, 3] },
  { id: "spare-outfit", name: "Just-in-case outfit", category: "clothes", when: [always], extraOnly: true },

  // ── Toiletries ───────────────────────────────────────────────
  { id: "toothbrush", name: "Toothbrush", category: "toiletries", when: [always] },
  { id: "toothpaste", name: "Toothpaste", category: "toiletries", when: [always], travelNote: LIQUID, shareable: true },
  { id: "deodorant", name: "Deodorant", category: "toiletries", when: [always], travelNote: "Sticks are fine; gels and sprays 3.4 fl oz or less in carry-ons" },
  { id: "shampoo", name: "Shampoo & conditioner", category: "toiletries", when: [always], travelNote: LIQUID, shareable: true },
  { id: "body-wash", name: "Body wash", category: "toiletries", when: [always], travelNote: LIQUID, shareable: true },
  { id: "skincare", name: "Skincare", category: "toiletries", when: [always], travelNote: LIQUID },
  { id: "hairbrush", name: "Hairbrush / comb", category: "toiletries", when: [always] },
  { id: "razor", name: "Razor", category: "toiletries", when: [always], travelNote: "Loose blades aren't allowed in carry-ons; cartridge razors are fine" },
  { id: "hairdryer", name: "Hairdryer", category: "toiletries", when: [always], note: "Skip it if your stay has one", shareable: true },
  { id: "meds", name: "Medications", category: "toiletries", when: [always], travelNote: "Liquid medicine can go over 3.4 fl oz: tell security" },
  { id: "painkillers", name: "Painkillers", category: "toiletries", when: [always], shareable: true },
  { id: "glasses", name: "Glasses / contacts", category: "toiletries", when: [always], note: "If you wear them", travelNote: "Contact solution: 3.4 fl oz or less in carry-ons" },
  { id: "sunscreen", name: "Sunscreen", category: "toiletries", when: [wx("warm"), act("beach"), act("pool"), act("skiing"), act("hiking")], travelNote: LIQUID, shareable: true },
  { id: "after-sun", name: "After-sun lotion", category: "toiletries", when: [act("beach")], extraOnly: true, travelNote: LIQUID, shareable: true },
  { id: "lip-balm", name: "Lip balm", category: "toiletries", when: [wx("cold"), act("skiing")] },
  { id: "bug-spray", name: "Bug spray", category: "toiletries", when: [act("hiking"), act("camping")], travelNote: LIQUID, shareable: true },
  { id: "first-aid", name: "First aid kit", category: "toiletries", when: [act("hiking"), act("camping")], travelNote: "Scissors over 4 inches can't be carried on", shareable: true },
  { id: "sanitizer", name: "Hand sanitizer", category: "toiletries", when: [always], extraOnly: true, travelNote: LIQUID },

  // ── Tech ─────────────────────────────────────────────────────
  { id: "phone-charger", name: "Phone charger", category: "tech", when: [always] },
  { id: "power-bank", name: "Power bank", category: "tech", when: [always], travelNote: "Can't go in checked bags" },
  { id: "headphones", name: "Headphones", category: "tech", when: [always] },
  { id: "laptop", name: "Laptop & charger", category: "tech", when: [quiz("working"), act("business")], travelNote: "Spare laptop batteries can't go in checked bags" },
  { id: "adapter", name: "Travel adapter", category: "tech", when: [quiz("international")], note: "Check the plug type", shareable: true },
  { id: "power-strip", name: "Small power strip", category: "tech", when: [always], extraOnly: true, shareable: true },
  { id: "speaker", name: "Portable speaker", category: "tech", when: [act("beach"), act("pool"), act("camping")], shareable: true },
  { id: "headlamp", name: "Headlamp / flashlight", category: "tech", when: [act("camping"), act("hiking")], travelNote: "Spare lithium batteries can't go in checked bags" },
  { id: "camera", name: "Camera", category: "tech", when: [act("sightseeing")], extraOnly: true },

  // ── Activity gear ────────────────────────────────────────────
  { id: "beach-towel", name: "Beach towel", category: "gear", when: [act("beach"), act("pool")] },
  { id: "beach-umbrella", name: "Beach umbrella", category: "gear", when: [act("beach")], extraOnly: true, shareable: true },
  { id: "daypack", name: "Daypack", category: "gear", when: [act("hiking"), act("sightseeing"), act("beach")] },
  { id: "sunglasses", name: "Sunglasses", category: "gear", when: [wx("warm"), wx("snow"), act("beach"), act("skiing")] },
  { id: "ski-goggles", name: "Ski goggles", category: "gear", when: [act("skiing")] },
  { id: "ski-gloves", name: "Ski gloves", category: "gear", when: [act("skiing")] },
  { id: "helmet", name: "Helmet", category: "gear", when: [act("skiing")], note: "Or rent one" },
  { id: "tent", name: "Tent", category: "gear", when: [act("camping")], shareable: true },
  { id: "sleeping-bag", name: "Sleeping bag", category: "gear", when: [act("camping")] },
  { id: "sleeping-pad", name: "Sleeping pad", category: "gear", when: [act("camping")] },
  { id: "camp-stove", name: "Camp stove & fuel", category: "gear", when: [act("camping")], travelNote: "Fuel can't fly: buy it when you get there", shareable: true },
  { id: "lantern", name: "Lantern", category: "gear", when: [act("camping")], shareable: true },
  { id: "cooler", name: "Cooler", category: "gear", when: [act("camping")], extraOnly: true, shareable: true },
  { id: "wedding-gift", name: "Wedding gift & card", category: "gear", when: [act("wedding")] },

  // ── Odds & ends ──────────────────────────────────────────────
  { id: "water-bottle", name: "Reusable water bottle", category: "extras", when: [always] },
  { id: "umbrella", name: "Umbrella", category: "extras", when: [wx("rain")], shareable: true },
  { id: "laundry-bag", name: "Laundry bag", category: "extras", when: [always] },
  { id: "detergent", name: "Laundry detergent sheets", category: "extras", when: [quiz("laundry")], shareable: true },
  { id: "snacks", name: "Travel snacks", category: "extras", when: [always] },
  { id: "book", name: "Book / e-reader", category: "extras", when: [always] },
  { id: "sleep-kit", name: "Earplugs & eye mask", category: "extras", when: [always], extraOnly: true },
  { id: "games", name: "Cards / board game", category: "extras", when: [act("camping")], extraOnly: true, shareable: true },
];

export const STYLE_INDEX: Record<PackingStyle, 0 | 1 | 2> = { light: 0, normal: 1, over: 2 };
