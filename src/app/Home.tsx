"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { browser } from "react-dom";
import { Doodle } from "@/components/Doodle";
import { Paint } from "@/components/Paint";
import { fmtMonth, fmtRange, tripTitle, untilText } from "@/lib/format";
import { daysBetween, formatTripLength, tripDates, tripLength } from "@/lib/packing/trip";
import { packedCount } from "@/lib/store/ops";
import { loadTrips, todayIso } from "@/lib/store/storage";

export function Home() {
  use(browser("Your trips are saved in this browser."));
  const router = useRouter();
  const [where, setWhere] = useState("");
  const today = todayIso();

  const trips = loadTrips()
    .filter((t) => t.stops.length > 0)
    .map((t) => ({ trip: t, ...tripDates(t.stops) }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const upcoming = trips.filter((t) => daysBetween(today, t.endDate) >= 0);
  const past = trips.filter((t) => daysBetween(today, t.endDate) < 0).reverse();

  function start(e: React.FormEvent) {
    e.preventDefault();
    const q = where.trim();
    router.push(q ? `/new?q=${encodeURIComponent(q)}` : "/new");
  }

  return (
    <main className="page page--wide">
      <span className="logo">
        <b>caboodle</b>
        <Doodle name="suitcase" size={36} />
      </span>

      <form className="stack" onSubmit={start} style={{ maxWidth: 520 }}>
        <label htmlFor="where" className="h1">Where are you off to?</label>
        <input className="cb-input" id="where" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Type a city, like Tokyo" autoComplete="off" />
        <button type="submit" className="cb-btn" style={{ justifySelf: "start", marginTop: 4 }}>Start a trip</button>
      </form>

      <section className="stack" aria-labelledby="upcoming-h">
        <span id="upcoming-h" className="cb-label">Coming up</span>
        {upcoming.length === 0 ? (
          <div className="empty">
            <span className="hand-note" style={{ color: "var(--ink)" }}>No trips yet.</span>
            <span className="cb-caption">Type a city above to start your first packing list.</span>
          </div>
        ) : (
          <div className="trips">
            {upcoming.map(({ trip, startDate, endDate }) => {
              const { nights, days } = tripLength(startDate, endDate);
              const packed = packedCount(trip);
              const total = trip.items.length;
              return (
                <Link key={trip.id} href={`/trip?id=${trip.id}`} className="trip-card">
                  <Paint colour={trip.cover} className="paint" />
                  <div className="body">
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                      <span className="name">{tripTitle(trip.stops)}</span>
                      <span className="cb-caption">{untilText(startDate, endDate, today)}</span>
                    </div>
                    <span className="cb-caption">{fmtRange(startDate, endDate)} · {formatTripLength(nights, days)}</span>
                    <div className="cb-progress">
                      <div className="cb-bar" style={{ height: 6 }}><i style={{ width: `${total ? (packed / total) * 100 : 0}%` }} /></div>
                      <span className="cb-caption">{packed} of {total}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="stack" aria-labelledby="past-h" style={{ maxWidth: 520 }}>
          <span id="past-h" className="cb-label">Past trips</span>
          <div>
            {past.map(({ trip, startDate }) => (
              <Link key={trip.id} href={`/trip?id=${trip.id}`} className="past">
                <b>{tripTitle(trip.stops)}</b>
                <span className="cb-caption">{fmtMonth(startDate)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="stack" style={{ marginTop: "auto", maxWidth: 520 }}>
        <p className="hand-note">the whole kit &amp; caboodle, packed.</p>
        <span className="cb-caption">
          Your trips are saved in this browser. To open one on another phone or computer, use “Copy backup link” on the trip. Add Caboodle to your home screen and it works without signal too.
        </span>
      </footer>
    </main>
  );
}
