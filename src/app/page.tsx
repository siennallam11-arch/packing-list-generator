// Temporary, unstyled preview of the packing logic.
// The real pages get built once the brand kit is ready.

import { generatePackingList } from "@/lib/packing/generate";
import { formatTripLength } from "@/lib/packing/trip";
import { DEFAULT_QUIZ } from "@/lib/packing/types";

const sample = generatePackingList({
  destination: "Tokyo",
  startDate: "2026-12-10",
  endDate: "2026-12-15",
  activities: ["sightseeing"],
  weather: ["cold", "cool", "rain"],
  quiz: { ...DEFAULT_QUIZ, international: true, fancyDinner: true, workout: true },
});

export default function Home() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <h1>Tokyo</h1>
      <p>
        Dec 10 – Dec 15 · {formatTripLength(sample.nights, sample.days)} · sample list
      </p>
      {sample.groups.map((group) => (
        <section key={group.category}>
          <h2>{group.label}</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {group.items.map((item) => (
              <li key={item.id}>
                <label>
                  <input type="checkbox" /> {item.name}
                  {item.quantity > 1 && ` ×${item.quantity}`}
                  {item.note && <small> · {item.note}</small>}
                  {item.reasons.length > 0 && <small> ({item.reasons.join(", ")})</small>}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
