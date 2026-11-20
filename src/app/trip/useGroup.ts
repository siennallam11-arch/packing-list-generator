"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { groupApi, listen, newToken, ping, toGroupStops, type GroupData, type GroupItem } from "@/lib/group/api";
import { findDouble, itemsToShare, moveToShared, myClaims, myProgress } from "@/lib/group/sync";
import { tripTitle } from "@/lib/format";
import type { Category } from "@/lib/packing/types";
import { refreshItems, restoreRule } from "@/lib/store/build";
import { loadHidden, todayIso } from "@/lib/store/storage";
import type { SavedStop, SavedTrip } from "@/lib/store/types";
import { refreshTripWeather } from "@/lib/store/weather";

export type GroupStatus = "solo" | "loading" | "ok" | "offline" | "gone";

/** Push your shareable items to the shared list, then take them off your own list. */
export async function shareMyItems(trip: SavedTrip): Promise<SavedTrip> {
  if (!trip.group) return trip;
  const { token, memberId } = trip.group;
  const items = itemsToShare(trip);
  const done: string[] = [];
  for (const i of items) {
    try {
      await groupApi.addItem(token, memberId, i.name, i.category, i.ruleId);
      done.push(i.ruleId as string);
    } catch {
      // offline: try again next time
    }
  }
  return done.length ? moveToShared(trip, done) : trip;
}

function sameStops(a: SavedStop[], b: GroupData["trip"]["stops"]): boolean {
  const key = (s: { id: string; startDate: string; endDate: string; destination: string }) => `${s.id}|${s.destination}|${s.startDate}|${s.endDate}`;
  return a.map(key).join() === b.map(key).join();
}

/**
 * Keeps a trip in step with its group: loads the shared list and everyone's progress,
 * listens for changes from friends, and sends your progress (numbers only).
 */
export function useGroup(trip: SavedTrip | undefined, latest: RefObject<SavedTrip | undefined>, commit: (t: SavedTrip, toast?: string, undoable?: boolean) => void) {
  const token = trip?.group?.token;
  const memberId = trip?.group?.memberId;
  const [data, setData] = useState<GroupData | null>(null);
  const [status, setStatus] = useState<GroupStatus>(token ? "loading" : "solo");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const d = await groupApi.get(token);
      if (!d) {
        setStatus("gone");
        return;
      }
      setData(d);
      setStatus("ok");
      // Someone changed the cities or dates: follow along.
      const current = latest.current;
      if (current && d.trip.stops.length && !sameStops(current.stops, d.trip.stops)) {
        const stops: SavedStop[] = d.trip.stops.map((g) => {
          const old = current.stops.find((s) => s.id === g.id && s.startDate === g.startDate && s.endDate === g.endDate);
          return old ? { ...old, ...g } : { ...g, weather: [] };
        });
        const next = refreshItems(current, stops, new Date().toISOString(), new Set(loadHidden().map((h) => h.ruleId)));
        commit({ ...next, change: { at: next.updatedAt, why: "The trip’s cities or dates changed.", added: next.change?.added ?? [], maybeNot: next.change?.maybeNot ?? [] } }, undefined, false);
        refreshTripWeather(next, todayIso()).then((w) => w && latest.current && commit(refreshItems(latest.current, w.stops, new Date().toISOString()), undefined, false));
      }
      // Shareable items still on your list (e.g. after a weather change) move to the shared list.
      if (current && itemsToShare(current).length) shareMyItems(current).then((t) => t !== current && commit(t, undefined, false));
    } catch {
      setStatus("offline");
    }
  }, [token, latest, commit]);

  useEffect(() => {
    if (!token) return;
    let live = true;
    const run = () => live && load();
    queueMicrotask(run);
    const stop = listen(token, run);
    const poll = setInterval(run, 30_000);
    const onVisible = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", run);
    return () => {
      live = false;
      stop();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", run);
    };
  }, [token, load]);

  const claims = myClaims(data, memberId);
  const progress = trip ? myProgress(trip, claims) : { packed: 0, total: 0 };

  // Share your progress (just the numbers), a moment after it changes.
  useEffect(() => {
    if (!token || !memberId || status !== "ok") return;
    const t = setTimeout(() => {
      groupApi.progress(token, memberId, progress.packed, progress.total).then(() => ping(token)).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [token, memberId, status, progress.packed, progress.total]);

  async function act(fn: () => Promise<unknown>) {
    if (!token) return;
    try {
      await fn();
      ping(token);
      await load();
    } catch {
      setStatus("offline");
    }
  }

  return {
    data,
    status,
    claims,
    progress,
    memberId,
    claim: (item: GroupItem, mine: boolean) => act(() => groupApi.claim(token as string, item.id, mine ? (memberId as string) : null)),
    note: (item: GroupItem, text: string) => act(() => groupApi.note(token as string, item.id, memberId as string, text)),
    remove: (item: GroupItem) => act(() => groupApi.removeItem(token as string, item.id)),
    add: async (name: string, category: Category): Promise<"added" | "double" | "failed"> => {
      if (!token || !memberId || !name.trim()) return "failed";
      if (data && findDouble(data.items, name, null)) return "double";
      try {
        await groupApi.addItem(token, memberId, name.trim(), category, null);
        ping(token);
        await load();
        return "added";
      } catch {
        setStatus("offline");
        return "failed";
      }
    },
    /** Turn a solo trip into a group trip; returns the invite token. */
    start: async (yourName: string): Promise<boolean> => {
      const current = latest.current;
      if (!current || current.group) return !!current?.group;
      const t = newToken();
      try {
        const id = await groupApi.create(t, tripTitle(current.stops), toGroupStops(current.stops), yourName.trim());
        const withGroup: SavedTrip = { ...current, group: { token: t, memberId: id, name: yourName.trim() } };
        commit(await shareMyItems(withGroup), undefined, false);
        return true;
      } catch {
        return false;
      }
    },
    leave: async () => {
      const current = latest.current;
      if (!current?.group) return;
      await groupApi.leave(current.group.token, current.group.memberId).catch(() => {});
      let solo: SavedTrip = { ...current, group: undefined, sharedPacked: [] };
      for (const id of current.sharedRuleIds ?? []) solo = restoreRule(solo, id, new Date().toISOString());
      commit({ ...solo, sharedRuleIds: [] }, "You left the group trip. Shared items are back on your list.", false);
      setData(null);
      setStatus("solo");
    },
  };
}
