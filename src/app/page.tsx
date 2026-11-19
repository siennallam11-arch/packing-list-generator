// Temporary, unstyled preview of the packing logic.
// The real pages get built from the brand kit next.

import { generatePackingList } from "@/lib/packing/generate";
import { formatTripLength, showQuantity, tripName } from "@/lib/packing/trip";
import { DEFAULT_QUIZ, type Stop } from "@/lib/packing/types";
import { describeWeather, formatRange } from "@/lib/weather/describe";
import type { WeatherSummary } from "@/lib/weather/openMeteo";

// Sample weather, shaped like what Open-Meteo returns for these dates.
const sample: { stop: Stop; dates: string; summary: WeatherSummary }[] = [
  {
    stop: { destination: "Tokyo", startDate: "2026-12-10", endDate: "2026-12-13", weather: ["cold", "cool", "rain"] },
    dates: "Dec 10 – 13",
    summary: { low: 2, high: 13, avgHigh: 11, avgLow: 4, days: 4, rainyDays: 1, snowyDays: 0, tags: ["cold", "cool", "rain"], partial: false, source: "last-year" },
  },
  {
    stop: { destination: "Kyoto", startDate: "2026-12-13", endDate: "2026-12-15", weather: ["freezing", "cold", "cool"] },
    dates: "Dec 13 – 15",
    summary: { low: -1, high: 10, avgHigh: 9, avgLow: 1, days: 3, rainyDays: 0, snowyDays: 0, tags: ["freezing", "cold", "cool"], partial: false, source: "last-year" },
  },
];

const stops = sample.map((s) => s.stop);
const list = generatePackingList({
  stops,
  activities: ["sightseeing"],
  quiz: { ...DEFAULT_QUIZ, international: true, fancyDinner: true, workout: true },
});

export default function Home() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <h1>{tripName(stops)}</h1>
      <p>Dec 10 – Dec 15 · {formatTripLength(list.nights, list.days)} · sample list</p>
      {sample.map(({ stop, dates, summary }) => (
        <p key={stop.destination}>
          <strong>{stop.destination}</strong> · {dates} · {formatRange(summary.low, summary.high)}
          <br />
          <small>{describeWeather(summary)}</small>
        </p>
      ))}
      {list.groups.map((group) => (
        <section key={group.category}>
          <h2>{group.label}</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {group.items.map((item) => (
              <li key={item.id}>
                <label>
                  <input type="checkbox" /> {item.name}
                  {showQuantity(item.quantity) && ` ×${item.quantity}`}
                  {item.note && <small> · {item.note}</small>}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
