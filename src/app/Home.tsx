"use client";

import Link from "next/link";
import { use } from "react";
import { browser } from "react-dom";
import { Doodle } from "@/components/Doodle";
import { CityBanner } from "@/components/CityBanner";
import { fmtMonth, fmtRange, tripTitle, untilText } from "@/lib/format";
import { daysBetween, tripDates } from "@/lib/packing/trip";
import { packedCount } from "@/lib/store/ops";
import { loadTrips, todayIso } from "@/lib/store/storage";

export function Home() {
  use(browser("Your trips are saved in this browser."));
  const today = todayIso();
  const trips = loadTrips()
    .filter((t) => t.stops.length > 0)
    .map((t) => ({ trip: t, ...tripDates(t.stops) }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const upcoming = trips.filter((t) => daysBetween(today, t.endDate) >= 0);
  const past = trips.filter((t) => daysBetween(today, t.endDate) < 0).reverse();

  return (
    <main className="page home">
      <section className="hero">
        <div className="hero-logo">
          <h1>caboodle</h1>
          <Doodle name="suitcase" size={72} />
        </div>
        <p className="tagline">packing, sorted.</p>
        <p className="hero-text">
          Tell Caboodle where you’re going, when, and what you’ll get up to. It checks the weather in every city and builds a packing list around your trip and the way you pack, so you can tick things off as they go in the bag.
        </p>
        <p className="hero-why">
          I made Caboodle because packing always meant scattered notes, last-minute panic and a forgotten charger. I wanted one calm place to plan what to bring and stay organized, from the first idea of a trip to zipping up the suitcase.
        </p>
        <Link className="cb-btn" href="/new">Start a trip</Link>
      </section>

      {(upcoming.length > 0 || past.length > 0) && (
        <section className="home-trips" aria-label="Your trips">
          {upcoming.length > 0 && <span className="cb-label">Your trips</span>}
          {upcoming.map(({ trip, startDate, endDate }) => {
            const packed = packedCount(trip);
            const total = trip.items.length;
            return (
              <Link key={trip.id} href={`/trip?id=${trip.id}`} className="home-trip">
                <span className="swatch"><CityBanner stops={trip.stops} mini /></span>
                <span className="grow">
                  <b>{tripTitle(trip.stops)}</b>
                  <span className="cb-caption">{fmtRange(startDate, endDate)} · {untilText(startDate, endDate, today)}</span>
                </span>
                <span className="cb-caption">{packed}/{total}</span>
              </Link>
            );
          })}
          {past.length > 0 && <span className="cb-label" style={{ marginTop: 12 }}>Past trips</span>}
          {past.map(({ trip, startDate }) => (
            <Link key={trip.id} href={`/trip?id=${trip.id}`} className="home-trip past-trip">
              <span className="swatch"><CityBanner stops={trip.stops} mini /></span>
              <span className="grow"><b>{tripTitle(trip.stops)}</b></span>
              <span className="cb-caption">{fmtMonth(startDate)}</span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
