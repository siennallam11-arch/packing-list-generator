"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { renderBanner } from "@/lib/banner/render";
import { clockText, localMinutesIn, paletteVars, weatherOf, type Weather } from "@/lib/banner/sky";
import { daysBetween } from "@/lib/packing/trip";
import { todayIso } from "@/lib/store/storage";
import type { SavedStop } from "@/lib/store/types";
import { getCurrentConditions, type CurrentConditions } from "@/lib/weather/openMeteo";

// A clock that ticks once a minute, so the sky moves while the page is open.
const clock = {
  subscribe(onTick: () => void) {
    const t = setInterval(onTick, 30_000);
    return () => clearInterval(t);
  },
  now: () => Math.floor(Date.now() / 60_000) * 60_000,
  server: () => 0,
};

// Current conditions per city, kept for 20 minutes.
const cache = new Map<string, { at: number; value: CurrentConditions }>();
const FRESH_MS = 20 * 60_000;

function tagsWeather(stop: SavedStop): Weather {
  if (stop.weather.includes("snow")) return "snow";
  if (stop.weather.includes("rain")) return "rain";
  return "clear";
}

function startIndex(stops: SavedStop[]): number {
  const today = todayIso();
  const i = stops.findIndex((s) => daysBetween(s.startDate, today) >= 0 && daysBetween(today, s.endDate) >= 0);
  return i >= 0 ? i : 0;
}

/**
 * The trip's banner: the city drawn in the doodle style, with the sky as it is there right now.
 * `mini` draws a small thumbnail without looking anything up.
 */
export function CityBanner({ stops, mini = false }: { stops: SavedStop[]; mini?: boolean }) {
  const [index, setIndex] = useState(() => startIndex(stops));
  const [conditions, setConditions] = useState<Record<string, { at: number; value: CurrentConditions }>>({});
  const now = useSyncExternalStore(clock.subscribe, clock.now, clock.server);
  const stop = stops[Math.min(index, stops.length - 1)];
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  // Wide screens get a wider scene (same height) rather than a cropped one.
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0) setWidth(Math.max(1200, Math.round((240 * w) / h / 50) * 50));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (mini || !stop) return;
    const key = `${stop.latitude.toFixed(2)},${stop.longitude.toFixed(2)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < FRESH_MS) {
      queueMicrotask(() => setConditions((c) => ({ ...c, [stop.id]: hit })));
      return;
    }
    let live = true;
    getCurrentConditions(stop)
      .then((value) => {
        const entry = { at: Date.now(), value };
        cache.set(key, entry);
        if (live) setConditions((c) => ({ ...c, [stop.id]: entry }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [stop, mini]);

  if (!stop) return null;
  const known = conditions[stop.id];
  const minutes = stop.timezone
    ? localMinutesIn(stop.timezone, new Date(now || known?.at || 0))
    : known
      ? Math.round(known.value.localMinutes + (now - known.at) / 60_000 + 1440) % 1440
      : localMinutesIn(undefined, new Date(now || 0));
  const banner = renderBanner({
    name: stop.destination,
    countryCode: stop.countryCode,
    population: stop.population,
    elevation: stop.elevation,
    minutes,
    sunrise: known?.value.sunrise ?? 400,
    sunset: known?.value.sunset ?? 1050,
    weather: known ? weatherOf(known.value.weatherCode, known.value.cloudCover) : tagsWeather(stop),
    cloudCover: known?.value.cloudCover ?? 30,
    width,
  });

  return (
    <div className="cbn-wrap" ref={box}>
      <svg
        className="cbn"
        viewBox={`0 0 ${Math.max(1200, width)} 240`}
        preserveAspectRatio="xMidYMax slice"
        role="img"
        aria-label={`${stop.destination} right now`}
        style={paletteVars(banner.palette) as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: banner.svg }}
      />
      {!mini && now > 0 && (
        <button
          type="button"
          className="cbn-chip"
          onClick={() => setIndex((index + 1) % stops.length)}
          disabled={stops.length < 2}
          aria-label={stops.length > 1 ? `${stop.destination}, ${clockText(minutes)} there. Show the next city` : undefined}
        >
          {stop.destination} · {clockText(minutes)}
          {stops.length > 1 && <span aria-hidden="true"> ›</span>}
        </button>
      )}
    </div>
  );
}
