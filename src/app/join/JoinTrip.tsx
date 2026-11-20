"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { CityBanner } from "@/components/CityBanner";
import { Doodle } from "@/components/Doodle";
import { fmtRange, tripTitle } from "@/lib/format";
import { groupApi, type GroupData } from "@/lib/group/api";
import { formatTripLength, tripDates, tripLength } from "@/lib/packing/trip";
import { loadTrips } from "@/lib/store/storage";
import type { SavedStop } from "@/lib/store/types";

export const JOIN_KEY = "caboodle:join";

/** What the new-trip flow needs to build a friend's own list for a group trip. */
export interface PendingJoin {
  token: string;
  memberId: string;
  name: string;
  stops: SavedStop[];
}

export function JoinTrip() {
  use(browser("Joining happens in this browser."));
  const router = useRouter();
  const [token] = useState(() => window.location.hash.slice(1));
  const [group, setGroup] = useState<GroupData | null>(null);
  const [state, setState] = useState<"loading" | "bad" | "offline" | "ok">(() => (token.length >= 20 ? "loading" : "bad"));
  const [name, setName] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = loadTrips().find((t) => t.group?.token === token);

  useEffect(() => {
    if (token.length < 20) return;
    groupApi
      .get(token)
      .then((d) => {
        setGroup(d);
        setState(d ? "ok" : "bad");
      })
      .catch(() => setState("offline"));
  }, [token]);

  if (state === "loading") return <main className="page" aria-busy="true" />;
  if (state !== "ok" || !group) {
    return (
      <main className="page">
        <Link className="back" href="/">‹ caboodle</Link>
        <h1 className="h1">{state === "offline" ? "You’re offline" : "This invite link doesn’t work"}</h1>
        <p className="cb-caption">
          {state === "offline" ? "Joining a trip needs a connection. Try again when you have signal." : "It may have been cut off when it was copied. Ask for the link again and open the whole thing."}
        </p>
      </main>
    );
  }

  const stops: SavedStop[] = group.trip.stops.map((s) => ({ ...s, weather: [] }));
  const hasStops = stops.length > 0;
  const dates = hasStops ? tripDates(stops) : null;
  const len = dates ? tripLength(dates.startDate, dates.endDate) : null;
  const chosen = existing ? group.members.find((m) => m.id === existing)?.name ?? "" : name.trim();

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen || !group) return;
    setBusy(true);
    try {
      const memberId = existing ?? (await groupApi.join(token, chosen));
      const pending: PendingJoin = { token, memberId, name: chosen, stops };
      sessionStorage.setItem(JOIN_KEY, JSON.stringify(pending));
      router.push("/new?join=1");
    } catch {
      setBusy(false);
      setState("offline");
    }
  }

  return (
    <>
      <div className="trip-top">
        {hasStops && <CityBanner stops={stops} />}
        <div className="badge" aria-hidden="true"><Doodle name="people" size={46} fill="var(--fill-green)" /></div>
      </div>
      <main className="page" style={{ paddingTop: 44, minHeight: 0 }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="cb-label">You’re invited to</span>
          <h1 className="cb-trip-title" style={{ fontSize: 40 }}>{hasStops ? tripTitle(stops) : group.trip.name}</h1>
          {dates && len && <span className="cb-trip-meta">{fmtRange(dates.startDate, dates.endDate)} · {formatTripLength(len.nights, len.days)}</span>}
        </div>

        {mine ? (
          <div className="stack">
            <p className="hand-note">you’re already on this trip in this browser.</p>
            <Link className="cb-btn" href={`/trip?id=${mine.id}`} style={{ justifySelf: "start" }}>Open my list</Link>
          </div>
        ) : (
          <form className="stack" onSubmit={join}>
            <div className="cb-field">
              <label htmlFor="who">Who are you?</label>
              <input id="who" className="cb-input" value={name} onChange={(e) => { setName(e.target.value); setExisting(null); }} maxLength={40} placeholder="Your first name" autoComplete="given-name" />
            </div>
            {group.members.length > 0 && (
              <div className="stack" style={{ gap: 8 }}>
                <span className="cb-caption">Already joined on another phone? Tap your name:</span>
                <div className="row">
                  {group.members.map((m) => (
                    <button key={m.id} type="button" className="cb-opt" aria-pressed={existing === m.id} onClick={() => { setExisting(m.id); setName(""); }} style={{ minHeight: 40 }}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="hand-note">no password. next you’ll answer a few quick questions and get your own list.</p>
            <button type="submit" className="cb-btn" disabled={!chosen || busy} style={{ justifySelf: "start" }}>{busy ? "Joining…" : chosen ? `Join as ${chosen}` : "Join the trip"}</button>
          </form>
        )}
      </main>
    </>
  );
}
