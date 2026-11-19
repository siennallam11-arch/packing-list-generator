import { describe, expect, it, vi } from "vitest";
import { DEFAULT_QUIZ } from "../packing/types";
import { decodeTrip, encodeTrip } from "./backup";
import { buildItems, refreshItems } from "./build";
import { learnFrom, suggestionsFor } from "./learning";
import { addItem, dismissChange, removeItem, setQuantity, togglePacked } from "./ops";
import type { SavedStop, SavedTrip } from "./types";
import { refreshTripWeather, stopNeedsWeather } from "./weather";

const stop = (over: Partial<SavedStop> = {}): SavedStop => ({
  id: "s1", destination: "Tokyo", countryCode: "JP", latitude: 35.7, longitude: 139.7,
  startDate: "2026-12-10", endDate: "2026-12-15", weather: ["cool"], ...over,
});

function makeTrip(over: Partial<SavedTrip> = {}): SavedTrip {
  const base = { stops: [stop()], activities: [], quiz: { ...DEFAULT_QUIZ, international: true } };
  const { items, removedRuleIds } = buildItems(base);
  return {
    v: 1, id: "t1", cover: "strawberry", ...base, items, removedRuleIds,
    dismissedSuggestions: [], createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", ...over,
  };
}
const item = (t: SavedTrip, key: string) => t.items.find((i) => i.key === key);

describe("building a trip's list", () => {
  it("skips the adapter when the plugs match home, with a note when they don't", () => {
    expect(item(makeTrip(), "adapter")).toBeUndefined(); // Japan: A/B
    const uk = makeTrip({ stops: [stop({ countryCode: "GB" })] });
    const built = buildItems(uk);
    expect(built.items.find((i) => i.key === "adapter")?.note).toBe("You'll need type G");
  });

  it("carries travel reminders", () => {
    expect(item(makeTrip(), "power-bank")?.travelNote).toBe("Can't go in checked bags");
  });
});

describe("refreshing after the weather changes", () => {
  it("adds new items, flags ones you may not need, and keeps your edits", () => {
    let trip = makeTrip();
    trip = togglePacked(trip, "light-jacket");
    trip = setQuantity(trip, "tops", 9);
    const colder = refreshItems(trip, [stop({ weather: ["freezing", "cold", "cool", "rain"] })], "2026-12-05T00:00:00Z");

    expect(item(colder, "warm-coat")).toMatchObject({ isNew: true });
    expect(item(colder, "umbrella")).toMatchObject({ isNew: true });
    expect(item(colder, "light-jacket")).toMatchObject({ packed: true, maybeNotNeeded: false });
    expect(item(colder, "tops")?.quantity).toBe(9);
    expect(colder.change?.added).toEqual(expect.arrayContaining(["Warm coat", "Umbrella", "Gloves"]));
    expect(colder.change?.why).toMatch(/Tokyo now has freezing temperatures/);
  });

  it("flags unpacked items that no longer apply instead of deleting them", () => {
    const trip = makeTrip({ stops: [stop({ weather: ["cool", "rain"] })] });
    const rebuilt = { ...trip, ...buildItems(trip) };
    const dry = refreshItems(rebuilt, [stop({ weather: ["cool"] })], "2026-12-05T00:00:00Z");
    expect(item(dry, "umbrella")).toMatchObject({ maybeNotNeeded: true });
    expect(dry.change?.maybeNot).toEqual(["Rain jacket", "Umbrella"]);
    expect(dismissChange(dry).change).toBeUndefined();
  });

  it("doesn't bring back items you removed", () => {
    const trip = removeItem(makeTrip(), "razor");
    expect(item(refreshItems(trip, [stop({ weather: ["warm"] })], "x"), "razor")).toBeUndefined();
  });
});

describe("learning from past trips", () => {
  const past = (n: number) => {
    let t = makeTrip({ id: `p${n}` });
    t = removeItem(t, "razor");
    t = addItem(t, "Kindle", "extras");
    t = setQuantity(t, "socks", (item(t, "socks")?.quantity ?? 0) + 2);
    return t;
  };

  it("needs a habit on two trips before acting", () => {
    const once = learnFrom([past(1)]);
    expect(once.usuallyRemoved.size).toBe(0);
    expect(once.usuallyAdded).toEqual([]);
  });

  it("skips usual removals, adjusts quantities and suggests usual additions", () => {
    const learned = learnFrom([past(1), past(2)]);
    expect([...learned.usuallyRemoved]).toEqual(["razor"]);
    expect(learned.quantityDelta.get("socks")).toBe(2);
    expect(learned.usuallyAdded).toEqual([{ name: "Kindle", category: "extras", trips: 2 }]);

    const base = { stops: [stop()], activities: [], quiz: DEFAULT_QUIZ };
    const fresh = buildItems(base, learned);
    expect(fresh.items.find((i) => i.key === "razor")).toBeUndefined();
    expect(fresh.removedRuleIds).toEqual(["razor"]);
    const plain = buildItems(base).items.find((i) => i.key === "socks")!.quantity;
    expect(fresh.items.find((i) => i.key === "socks")?.quantity).toBe(plain + 2);

    const trip = makeTrip();
    expect(suggestionsFor(trip, learned).map((s) => s.name)).toEqual(["Kindle"]);
    expect(suggestionsFor({ ...trip, dismissedSuggestions: ["kindle"] }, learned)).toEqual([]);
  });
});

describe("weather refresh", () => {
  it("knows when a stop needs a lookup", () => {
    const now = Date.parse("2026-12-01T12:00:00Z");
    expect(stopNeedsWeather(stop(), "2026-12-01", now)).toBe(true);
    const fresh = stop({ summary: { low: 2, high: 13, avgHigh: 11, avgLow: 3, days: 6, rainyDays: 0, snowyDays: 0, tags: [], partial: false, source: "forecast" }, fetchedAt: "2026-12-01T11:00:00Z" });
    expect(stopNeedsWeather(fresh, "2026-12-01", now)).toBe(false);
    expect(stopNeedsWeather({ ...fresh, fetchedAt: "2026-12-01T06:00:00Z" }, "2026-12-01", now)).toBe(true);
    expect(stopNeedsWeather(stop({ endDate: "2026-11-20" }), "2026-12-01", now)).toBe(false);
  });

  it("keeps the old weather when offline", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await refreshTripWeather(makeTrip(), "2026-12-01", fetchFn)).toBeNull();
  });
});

describe("backup links", () => {
  it("round-trips a trip", async () => {
    const trip = makeTrip();
    const code = await encodeTrip(trip);
    expect(code[0]).toBe("z");
    expect(await decodeTrip(code)).toEqual(trip);
    expect(await decodeTrip("zgarbage")).toBeNull();
  });
});
