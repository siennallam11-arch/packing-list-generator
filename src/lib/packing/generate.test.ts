import { describe, expect, it } from "vitest";
import { generatePackingList, packingDays, resolveQuantity } from "./generate";
import { RULES } from "./rules";
import { formatTripLength, showQuantity, tripDates, tripLength, tripName, tripWeather } from "./trip";
import { CATEGORY_ORDER, DEFAULT_QUIZ, type PackingList, type Stop, type TripInput, type WeatherTag } from "./types";

type TripOverrides = Partial<Omit<TripInput, "stops">> & { weather?: WeatherTag[] };

/** A one-city Tokyo trip, Dec 10–15 (5 nights, 6 days). */
const trip = ({ weather = [], ...overrides }: TripOverrides = {}, quiz: Partial<TripInput["quiz"]> = {}): TripInput => ({
  stops: [{ destination: "Tokyo", startDate: "2026-12-10", endDate: "2026-12-15", weather }],
  activities: [],
  ...overrides,
  quiz: { ...DEFAULT_QUIZ, ...quiz },
});

const find = (list: PackingList, id: string) =>
  list.groups.flatMap((g) => g.items).find((item) => item.id === id);

describe("trip length", () => {
  it("counts nights and days", () => {
    expect(tripLength("2026-12-10", "2026-12-15")).toEqual({ nights: 5, days: 6 });
    expect(tripLength("2026-12-10", "2026-12-10")).toEqual({ nights: 0, days: 1 });
    expect(tripLength("2026-12-30", "2027-01-02")).toEqual({ nights: 3, days: 4 });
  });

  it("rejects backwards and invalid dates", () => {
    expect(() => tripLength("2026-12-15", "2026-12-10")).toThrow();
    expect(() => tripLength("2026-02-30", "2026-03-02")).toThrow();
  });

  it("shows a quantity only when it's more than one", () => {
    expect(showQuantity(1)).toBe(false);
    expect(showQuantity(6)).toBe(true);
  });

  it("formats", () => {
    expect(formatTripLength(5, 6)).toBe("5 nights · 6 days");
    expect(formatTripLength(1, 2)).toBe("1 night · 2 days");
  });
});

describe("multi-city trips", () => {
  const stops: Stop[] = [
    { destination: "Tokyo", startDate: "2026-12-10", endDate: "2026-12-13", weather: ["cool", "rain"] },
    { destination: "Kyoto", startDate: "2026-12-13", endDate: "2026-12-15", weather: ["freezing", "cold", "cool"] },
  ];

  it("spans first to last day and names the trip", () => {
    expect(tripDates(stops)).toEqual({ startDate: "2026-12-10", endDate: "2026-12-15" });
    expect(tripName(stops)).toBe("Tokyo + Kyoto");
    expect(() => tripDates([])).toThrow();
  });

  it("packs for every city's weather", () => {
    expect(tripWeather(stops).sort()).toEqual(["cold", "cool", "freezing", "rain"]);
    const list = generatePackingList({ stops, activities: [], quiz: DEFAULT_QUIZ });
    expect(list.days).toBe(6);
    expect(find(list, "umbrella")).toBeDefined(); // Tokyo rain
    expect(find(list, "gloves")).toBeDefined(); // Kyoto freezing
  });
});

describe("quantities", () => {
  it("caps packing days with and without laundry", () => {
    expect(packingDays(3, true)).toBe(3);
    expect(packingDays(14, true)).toBe(5);
    expect(packingDays(14, false)).toBe(10);
  });

  it("scales with packing style", () => {
    const t = (packingStyle: "light" | "normal" | "over") => trip({}, { packingStyle });
    expect([t("light"), t("normal"), t("over")].map((x) => resolveQuantity("perDay", x, 6))).toEqual([5, 6, 7]);
    expect([t("light"), t("normal"), t("over")].map((x) => resolveQuantity("perDayPlusSpare", x, 6))).toEqual([6, 7, 8]);
    expect([t("light"), t("normal"), t("over")].map((x) => resolveQuantity("everyFewDays", x, 6))).toEqual([2, 2, 3]);
    expect(resolveQuantity("everyFewDays", t("light"), 1)).toBe(1);
  });
});

describe("generatePackingList", () => {
  it("builds a basic list in category order with nights and days", () => {
    const list = generatePackingList(trip());
    expect(list.nights).toBe(5);
    expect(list.days).toBe(6);
    const order = list.groups.map((g) => g.category);
    expect(order).toEqual(CATEGORY_ORDER.filter((c) => order.includes(c)));
    expect(find(list, "toothbrush")).toBeDefined();
    expect(find(list, "underwear")?.quantity).toBe(7);
    expect(find(list, "passport")).toBeUndefined();
    expect(find(list, "swimsuit")).toBeUndefined();
  });

  it("Tokyo in December: cold, international, fancy dinner, workout", () => {
    const list = generatePackingList(
      trip(
        { activities: ["sightseeing"], weather: ["cold", "cool", "rain"] },
        { international: true, fancyDinner: true, workout: true },
      ),
    );
    for (const id of ["passport", "adapter", "warm-coat", "umbrella", "dressy-outfit", "dress-shoes", "sneakers", "daypack"]) {
      expect(find(list, id), id).toBeDefined();
    }
    // cold replaces the light jacket
    expect(find(list, "light-jacket")).toBeUndefined();
    expect(find(list, "warm-coat")?.reasons).toEqual(["Cold weather"]);
  });

  it("explains every reason an item was added", () => {
    const list = generatePackingList(trip({ activities: ["beach", "pool"], weather: ["warm"] }));
    expect(find(list, "sunscreen")?.reasons).toEqual(["Warm days", "Beach", "Pool"]);
    expect(find(list, "toothbrush")?.reasons).toEqual([]);
  });

  it("adds ski gear", () => {
    const list = generatePackingList(trip({ activities: ["skiing"] }));
    for (const id of ["ski-wear", "ski-goggles", "thermals", "beanie", "ski-pass", "sunscreen"]) {
      expect(find(list, id), id).toBeDefined();
    }
  });

  it("only gives overpackers the just-in-case items", () => {
    expect(find(generatePackingList(trip()), "spare-outfit")).toBeUndefined();
    expect(find(generatePackingList(trip({}, { packingStyle: "over" })), "spare-outfit")).toBeDefined();
  });

  it("uses travel-size notes for carry-on only", () => {
    expect(find(generatePackingList(trip()), "shampoo")?.note).toBeUndefined();
    expect(find(generatePackingList(trip({}, { carryOnOnly: true })), "shampoo")?.note).toMatch(/100 ml/);
  });

  it("marks group items as shareable", () => {
    const list = generatePackingList(trip({ activities: ["beach"] }));
    expect(find(list, "hairdryer")?.shareable).toBe(true);
    expect(find(list, "speaker")?.shareable).toBe(true);
    expect(find(list, "toothbrush")?.shareable).toBe(false);
  });

  it("has unique rule ids", () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
