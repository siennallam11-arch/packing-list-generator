// How a personal list and a group trip fit together.
// Shareable items (hairdryer, speaker, sunscreen…) move off your own list onto the shared
// list, once per trip. Shared items you claim show up on your list so you pack them.

import type { SavedItem, SavedTrip } from "../store/types";
import type { GroupData, GroupItem } from "./api";

/** Shareable items on your list that should go to the shared list. */
export function itemsToShare(trip: SavedTrip): SavedItem[] {
  const shared = new Set(trip.sharedRuleIds ?? []);
  return trip.items.filter((i) => i.shareable && i.ruleId && !shared.has(i.ruleId));
}

/** Take shared items off your own list (they now live on the shared list). */
export function moveToShared(trip: SavedTrip, ruleIds: string[]): SavedTrip {
  const ids = new Set(ruleIds);
  return {
    ...trip,
    items: trip.items.filter((i) => !(i.ruleId && ids.has(i.ruleId))),
    sharedRuleIds: [...new Set([...(trip.sharedRuleIds ?? []), ...ruleIds])],
  };
}

/** Is this shared item the same thing as one already on the list? (Spots doubles.) */
export function findDouble(items: GroupItem[], name: string, ruleId: string | null): GroupItem | undefined {
  const n = name.trim().toLowerCase();
  return items.find((i) => (ruleId && i.ruleId === ruleId) || i.name.trim().toLowerCase() === n);
}

/** Shared items you said you'd bring. */
export function myClaims(group: GroupData | null, memberId: string | undefined): GroupItem[] {
  if (!group || !memberId) return [];
  return group.items.filter((i) => i.claimedBy === memberId);
}

/** Your progress, counting the shared things you're bringing. */
export function myProgress(trip: SavedTrip, claims: GroupItem[]): { packed: number; total: number } {
  const packedShared = new Set(trip.sharedPacked ?? []);
  return {
    packed: trip.items.filter((i) => i.packed).length + claims.filter((c) => packedShared.has(c.id)).length,
    total: trip.items.length + claims.length,
  };
}

export function toggleSharedPacked(trip: SavedTrip, itemId: string): SavedTrip {
  const set = new Set(trip.sharedPacked ?? []);
  if (set.has(itemId)) set.delete(itemId);
  else set.add(itemId);
  return { ...trip, sharedPacked: [...set] };
}
