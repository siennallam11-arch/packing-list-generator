import { describe, expect, it } from "vitest";
import { DEFAULT_QUIZ } from "../packing/types";
import { buildItems, refreshItems } from "../store/build";
import type { SavedTrip } from "../store/types";
import type { GroupData } from "./api";
import { findDouble, itemsToShare, moveToShared, myClaims, myProgress, toggleSharedPacked } from "./sync";

function trip(): SavedTrip {
  const base = {
    stops: [{ id: "s1", destination: "Seoul", countryCode: "KR", latitude: 37.6, longitude: 127, startDate: "2026-12-19", endDate: "2026-12-25", weather: ["cold" as const] }],
    activities: [],
    quiz: DEFAULT_QUIZ,
  };
  const { items, removedRuleIds } = buildItems(base);
  return { v: 1, id: "t", cover: "strawberry", ...base, items, removedRuleIds, dismissedSuggestions: [], createdAt: "x", updatedAt: "x" };
}

const group: GroupData = {
  trip: { id: "g", name: "seoul", stops: [], updatedAt: "x" },
  members: [{ id: "me", name: "Me", packed: 0, total: 0 }, { id: "mia", name: "Mia", packed: 5, total: 10 }],
  items: [
    { id: "i1", ruleId: "hairdryer", name: "Hairdryer", category: "toiletries", claimedBy: "me", note: null, noteBy: null, addedBy: "me" },
    { id: "i2", ruleId: null, name: "Speaker", category: "tech", claimedBy: "mia", note: null, noteBy: null, addedBy: "mia" },
  ],
};

describe("group trips", () => {
  it("moves shareable items to the shared list and keeps them off yours", () => {
    const t = trip();
    const share = itemsToShare(t).map((i) => i.ruleId as string);
    expect(share).toEqual(expect.arrayContaining(["hairdryer", "shampoo", "toothpaste"]));
    const moved = moveToShared(t, share);
    expect(moved.items.find((i) => i.ruleId === "hairdryer")).toBeUndefined();
    expect(itemsToShare(moved)).toEqual([]);
    const refreshed = refreshItems(moved, moved.stops, "x");
    expect(refreshed.items.find((i) => i.ruleId === "hairdryer")).toBeUndefined();
  });

  it("spots doubles by suggestion or by name", () => {
    expect(findDouble(group.items, "hairdryer ", null)?.id).toBe("i1");
    expect(findDouble(group.items, "Blow dryer", "hairdryer")?.id).toBe("i1");
    expect(findDouble(group.items, "Board game", null)).toBeUndefined();
  });

  it("counts shared things you're bringing in your progress", () => {
    const t = moveToShared(trip(), ["hairdryer"]);
    const claims = myClaims(group, "me");
    expect(claims.map((c) => c.id)).toEqual(["i1"]);
    const before = myProgress(t, claims);
    const after = myProgress(toggleSharedPacked(t, "i1"), claims);
    expect(after.total).toBe(before.total);
    expect(after.packed).toBe(before.packed + 1);
  });
});
