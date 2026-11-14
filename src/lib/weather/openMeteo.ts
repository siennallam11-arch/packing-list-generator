// Weather from Open-Meteo (https://open-meteo.com): free, no API key needed.

import { addDays, daysBetween } from "../packing/trip";
import type { WeatherTag } from "../packing/types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Open-Meteo forecasts cover today plus the next 15 days. */
export const FORECAST_HORIZON_DAYS = 15;

export interface Place {
  name: string;
  country?: string;
  region?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface GeocodingResponse {
  results?: {
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }[];
}

/** Look up a place by name, e.g. "Tokyo". Best matches first. */
export async function searchPlaces(query: string, fetchFn: typeof fetch = fetch): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${GEOCODING_URL}?${new URLSearchParams({ name: q, count: "5", language: "en", format: "json" })}`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = (await res.json()) as GeocodingResponse;
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    region: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}

export interface DailyForecast {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_probability_max: (number | null)[];
  precipitation_sum: (number | null)[];
  snowfall_sum: (number | null)[];
}

export interface WeatherSummary {
  /** Lowest overnight temperature, °C */
  low: number;
  /** Highest daytime temperature, °C */
  high: number;
  rainyDays: number;
  snowyDays: number;
  tags: WeatherTag[];
  /** True when the forecast doesn't reach the end of the trip yet. */
  partial: boolean;
}

export type WeatherResult =
  | { status: "ok"; summary: WeatherSummary }
  | { status: "too-far"; availableFrom: string };

// Thresholds that turn numbers into packing decisions (°C, mm, %).
export const THRESHOLDS = {
  freezingLow: 0, // low at or below → gloves, scarf, thermals
  coldLow: 8, // low below → warm coat
  coolLow: 15, // low below → light jacket
  warmHigh: 22, // high at or above → shorts, sunscreen
  hotHigh: 28, // high at or above → sandals, sun hat
  rainProbability: 50,
  rainMm: 2,
  snowCm: 0.5,
};

const nums = (values: (number | null)[]) => values.filter((v): v is number => v !== null);

export function summarizeForecast(daily: DailyForecast, partial = false): WeatherSummary {
  const lows = nums(daily.temperature_2m_min);
  const highs = nums(daily.temperature_2m_max);
  if (lows.length === 0 || highs.length === 0) throw new Error("Forecast has no temperatures");

  const low = Math.min(...lows);
  const high = Math.max(...highs);

  const rainyDays = daily.time.filter(
    (_, i) =>
      (daily.precipitation_probability_max[i] ?? 0) >= THRESHOLDS.rainProbability ||
      (daily.precipitation_sum[i] ?? 0) >= THRESHOLDS.rainMm,
  ).length;
  const snowyDays = daily.snowfall_sum.filter((s) => (s ?? 0) >= THRESHOLDS.snowCm).length;

  const tags: WeatherTag[] = [];
  if (low <= THRESHOLDS.freezingLow) tags.push("freezing");
  if (low < THRESHOLDS.coldLow) tags.push("cold");
  if (low < THRESHOLDS.coolLow) tags.push("cool");
  if (high >= THRESHOLDS.warmHigh) tags.push("warm");
  if (high >= THRESHOLDS.hotHigh) tags.push("hot");
  if (rainyDays > 0) tags.push("rain");
  if (snowyDays > 0) tags.push("snow");

  return { low: Math.round(low), high: Math.round(high), rainyDays, snowyDays, tags, partial };
}

/**
 * Get the weather for a trip. Trips that start more than ~2 weeks out
 * return "too-far" (the page then asks the user to pick the weather by hand).
 */
export async function getTripWeather(
  place: Pick<Place, "latitude" | "longitude">,
  startDate: string,
  endDate: string,
  today: string,
  fetchFn: typeof fetch = fetch,
): Promise<WeatherResult> {
  const lastForecastDay = addDays(today, FORECAST_HORIZON_DAYS);
  if (daysBetween(lastForecastDay, startDate) > 0) {
    return { status: "too-far", availableFrom: addDays(startDate, -FORECAST_HORIZON_DAYS) };
  }

  const from = daysBetween(today, startDate) > 0 ? startDate : today;
  const partial = daysBetween(lastForecastDay, endDate) > 0;
  const to = partial ? lastForecastDay : endDate;

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,snowfall_sum",
    timezone: "auto",
    start_date: from,
    end_date: to,
  });
  const res = await fetchFn(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather lookup failed (${res.status})`);
  const data = (await res.json()) as { daily: DailyForecast };
  return { status: "ok", summary: summarizeForecast(data.daily, partial) };
}

/** For trips too far out for a forecast: "What will it feel like?" */
export type WeatherFeel = "cold" | "cool" | "warm" | "hot";

export function tagsFromManualPick(feel: WeatherFeel, rain: boolean, snow = false): WeatherTag[] {
  const byFeel: Record<WeatherFeel, WeatherTag[]> = {
    cold: ["freezing", "cold", "cool"],
    cool: ["cool"],
    warm: ["warm"],
    hot: ["warm", "hot"],
  };
  return [...byFeel[feel], ...(rain ? (["rain"] as const) : []), ...(snow ? (["snow"] as const) : [])];
}
