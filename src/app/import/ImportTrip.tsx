"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { Doodle } from "@/components/Doodle";
import { fmtRange, tripTitle } from "@/lib/format";
import { tripDates } from "@/lib/packing/trip";
import { decodeTrip } from "@/lib/store/backup";
import { getTrip, newTripId, saveTrip } from "@/lib/store/storage";
import type { SavedTrip } from "@/lib/store/types";

export function ImportTrip() {
  use(browser("Backups are opened in this browser."));
  const router = useRouter();
  const [code] = useState(() => window.location.hash.slice(1));
  const [state, setState] = useState<{ status: "reading" | "bad" | "ok"; trip?: SavedTrip }>(() => ({ status: code ? "reading" : "bad" }));

  useEffect(() => {
    if (!code) return;
    decodeTrip(code).then((trip) => setState(trip ? { status: "ok", trip } : { status: "bad" }));
  }, [code]);

  if (state.status === "reading") return <main className="page" aria-busy="true" />;
  if (state.status === "bad" || !state.trip) {
    return (
      <main className="page">
        <Link className="back" href="/">‹ trips</Link>
        <h1 className="h1">This backup link doesn’t work</h1>
        <p className="cb-caption">It may have been cut off when it was copied. Copy the whole link again and open it here.</p>
      </main>
    );
  }

  const trip = state.trip;
  const existing = getTrip(trip.id);
  const { startDate, endDate } = tripDates(trip.stops);
  const packed = trip.items.filter((i) => i.packed).length;

  function save(asCopy: boolean) {
    const now = new Date().toISOString();
    const t = asCopy ? { ...trip, id: newTripId(), updatedAt: now } : trip;
    saveTrip(t);
    router.replace(`/trip?id=${t.id}`);
  }

  return (
    <main className="page">
      <Link className="back" href="/">‹ trips</Link>
      <Doodle name="suitcase" size={72} />
      <div className="stack" style={{ gap: 6 }}>
        <span className="cb-label">Backup of</span>
        <h1 className="cb-trip-title" style={{ fontSize: 40 }}>{tripTitle(trip.stops)}</h1>
        <span className="cb-caption">{fmtRange(startDate, endDate)} · {packed} of {trip.items.length} packed</span>
      </div>
      {existing ? (
        <div className="stack">
          <p className="hand-note">this trip is already in this browser.</p>
          <button type="button" className="cb-btn" onClick={() => save(false)}>Replace it with this backup</button>
          <button type="button" className="cb-btn cb-btn--quiet" onClick={() => save(true)}>Keep both</button>
        </div>
      ) : (
        <button type="button" className="cb-btn" onClick={() => save(false)} style={{ justifySelf: "start" }}>Add to my trips</button>
      )}
    </main>
  );
}
