import { describe, expect, it, vi } from "vitest";
import { getTripWeather, searchPlaces, summarizeForecast, tagsFromManualPick, type DailyForecast } from "./openMeteo";

// Shaped like a real Open-Meteo response for Tokyo in mid-December.
const tokyoDecember: DailyForecast = {
  time: ["2026-12-10", "2026-12-11", "2026-12-12", "2026-12-13"],
  temperature_2m_max: [12.1, 10.4, 9.8, 13.2],
  temperature_2m_min: [3.2, 1.9, 2.5, 4.0],
  precipitation_probability_max: [10, 65, 20, 5],
  precipitation_sum: [0, 4.2, 0.1, 0],
  snowfall_sum: [0, 0, 0, 0],
};

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("summarizeForecast", () => {
  it("turns Tokyo in December into cold + rain", () => {
    const s = summarizeForecast(tokyoDecember);
    expect(s).toMatchObject({ low: 2, high: 13, rainyDays: 1, snowyDays: 0 });
    expect(s.tags).toEqual(["cold", "cool", "rain"]);
  });

  it("flags hot, snowy and freezing weather", () => {
    expect(summarizeForecast({ ...tokyoDecember, temperature_2m_max: [31, 29, 30, 30], temperature_2m_min: [24, 23, 25, 24], precipitation_probability_max: [0, 0, 0, 0], precipitation_sum: [0, 0, 0, 0] }).tags).toEqual(["warm", "hot"]);
    expect(summarizeForecast({ ...tokyoDecember, temperature_2m_min: [-3, -1, 0, 1], snowfall_sum: [0, 2.1, 0, 0] }).tags).toEqual(["freezing", "cold", "cool", "rain", "snow"]);
  });

  it("ignores missing values", () => {
    expect(summarizeForecast({ ...tokyoDecember, temperature_2m_min: [null, 5, null, 6] }).low).toBe(5);
  });
});

describe("getTripWeather", () => {
  const tokyo = { latitude: 35.69, longitude: 139.69 };

  it("says too-far when the trip is beyond the forecast", async () => {
    const fetchFn = vi.fn();
    const result = await getTripWeather(tokyo, "2026-12-10", "2026-12-15", "2026-11-14", fetchFn);
    expect(result).toEqual({ status: "too-far", availableFrom: "2026-11-25" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("asks for the trip dates when within range", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ daily: tokyoDecember }));
    const result = await getTripWeather(tokyo, "2026-12-10", "2026-12-13", "2026-12-03", fetchFn);
    const url = new URL(fetchFn.mock.calls[0][0]);
    expect(url.searchParams.get("start_date")).toBe("2026-12-10");
    expect(url.searchParams.get("end_date")).toBe("2026-12-13");
    expect(result.status === "ok" && result.summary.partial).toBe(false);
  });

  it("clips long trips to the forecast horizon and marks them partial", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ daily: tokyoDecember }));
    const result = await getTripWeather(tokyo, "2026-12-10", "2026-12-30", "2026-12-03", fetchFn);
    expect(new URL(fetchFn.mock.calls[0][0]).searchParams.get("end_date")).toBe("2026-12-18");
    expect(result.status === "ok" && result.summary.partial).toBe(true);
  });
});

describe("searchPlaces", () => {
  it("maps geocoding results", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ results: [{ name: "Tokyo", country: "Japan", admin1: "Tokyo", latitude: 35.69, longitude: 139.69, timezone: "Asia/Tokyo" }] }),
    );
    expect(await searchPlaces("Tokyo", fetchFn)).toEqual([
      { name: "Tokyo", country: "Japan", region: "Tokyo", latitude: 35.69, longitude: 139.69, timezone: "Asia/Tokyo" },
    ]);
    expect(await searchPlaces("T", fetchFn)).toEqual([]);
  });
});

describe("tagsFromManualPick", () => {
  it("maps feel + rain to tags", () => {
    expect(tagsFromManualPick("cold", true)).toEqual(["freezing", "cold", "cool", "rain"]);
    expect(tagsFromManualPick("hot", false)).toEqual(["warm", "hot"]);
  });
});
