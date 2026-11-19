// Weather from Open-Meteo (https://open-meteo.com): free, no API key needed.

import { addDays, daysBetween } from "../packing/trip";
import type { WeatherTag } from "../packing/types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

/** Open-Meteo forecasts cover today plus the next 15 days. */
export const FORECAST_HORIZON_DAYS = 15;

export interface Place {
  name: string;
  country?: string;
  /** ISO 3166-1 alpha-2, e.g. "JP" */
  countryCode?: string;
  region?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
  elevation?: number;
}

interface GeocodingResponse {
  results?: {
    name: string;
    country?: string;
    country_code?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    population?: number;
    elevation?: number;
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
    countryCode: r.country_code?.toUpperCase(),
    region: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    population: r.population,
    elevation: r.elevation,
  }));
}

export interface DailyForecast {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  /** Forecasts only; historical data has no probabilities. */
  precipitation_probability_max?: (number | null)[];
  precipitation_sum: (number | null)[];
  snowfall_sum: (number | null)[];
}

export type WeatherSource = "forecast" | "last-year";

/** Temperatures are stored in °C (the thresholds use °C); show them with formatTemp. */
export interface WeatherSummary {
  /** Lowest overnight temperature, °C */
  low: number;
  /** Highest daytime temperature, °C */
  high: number;
  /** Typical daytime high, °C */
  avgHigh: number;
  /** Typical overnight low, °C */
  avgLow: number;
  days: number;
  rainyDays: number;
  snowyDays: number;
  tags: WeatherTag[];
  /** True when the forecast doesn't reach the end of the stop yet. */
  partial: boolean;
  /** Real forecast, or the same dates last year for trips beyond the forecast. */
  source: WeatherSource;
  /** For "last-year": when the real forecast becomes available. */
  forecastFrom?: string;
}

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

const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function summarizeForecast(
  daily: DailyForecast,
  partial = false,
  source: WeatherSource = "forecast",
): WeatherSummary {
  const lows = nums(daily.temperature_2m_min);
  const highs = nums(daily.temperature_2m_max);
  if (lows.length === 0 || highs.length === 0) throw new Error("Forecast has no temperatures");

  const low = Math.min(...lows);
  const high = Math.max(...highs);

  const rainyDays = daily.time.filter(
    (_, i) =>
      (daily.precipitation_probability_max?.[i] ?? 0) >= THRESHOLDS.rainProbability ||
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

  return {
    low: Math.round(low),
    high: Math.round(high),
    avgHigh: Math.round(avg(highs)),
    avgLow: Math.round(avg(lows)),
    days: daily.time.length,
    rainyDays,
    snowyDays,
    tags,
    partial,
    source,
  };
}

const DAILY_FORECAST = "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,snowfall_sum";
const DAILY_ARCHIVE = "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum";

/** The same calendar dates, `years` earlier (Feb 29 becomes Feb 28). */
export function shiftYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const year = y - years;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const day = m === 2 && d === 29 && !leap ? 28 : d;
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Get the weather for one city's dates.
 * Within ~2 weeks: the real forecast. Further out: the same dates last year,
 * which is a good guide to what's typical, until the forecast arrives.
 */
export async function getStopWeather(
  place: Pick<Place, "latitude" | "longitude">,
  startDate: string,
  endDate: string,
  today: string,
  fetchFn: typeof fetch = fetch,
): Promise<WeatherSummary> {
  const lastForecastDay = addDays(today, FORECAST_HORIZON_DAYS);
  const base = { latitude: String(place.latitude), longitude: String(place.longitude), timezone: "auto" };

  if (daysBetween(lastForecastDay, startDate) > 0) {
    // Go back whole years until the dates are safely in the past.
    let years = 1;
    while (daysBetween(shiftYears(endDate, years), today) < 7) years++;
    const params = new URLSearchParams({
      ...base,
      daily: DAILY_ARCHIVE,
      start_date: shiftYears(startDate, years),
      end_date: shiftYears(endDate, years),
    });
    const res = await fetchFn(`${ARCHIVE_URL}?${params}`);
    if (!res.ok) throw new Error(`Weather lookup failed (${res.status})`);
    const data = (await res.json()) as { daily: DailyForecast };
    return {
      ...summarizeForecast(data.daily, false, "last-year"),
      forecastFrom: addDays(startDate, -FORECAST_HORIZON_DAYS),
    };
  }

  const from = daysBetween(today, startDate) > 0 ? startDate : today;
  const partial = daysBetween(lastForecastDay, endDate) > 0;
  const to = partial ? lastForecastDay : endDate;
  const params = new URLSearchParams({ ...base, daily: DAILY_FORECAST, start_date: from, end_date: to });
  const res = await fetchFn(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather lookup failed (${res.status})`);
  const data = (await res.json()) as { daily: DailyForecast };
  return summarizeForecast(data.daily, partial, "forecast");
}

/** Fallback if the weather service is down: "What will it feel like?" */
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

/** What it's like in a city right now: local time, daylight and weather. */
export interface CurrentConditions {
  /** Minutes since local midnight, e.g. 19:42 → 1182 */
  localMinutes: number;
  /** Today's sunrise and sunset, in local minutes */
  sunrise: number;
  sunset: number;
  /** WMO weather code (0 clear … 99 thunderstorm) */
  weatherCode: number;
  /** 0–100 */
  cloudCover: number;
}

const minutesOf = (localIso: string) => {
  const [h, m] = localIso.slice(11, 16).split(":").map(Number);
  return h * 60 + m;
};

export async function getCurrentConditions(
  place: Pick<Place, "latitude" | "longitude">,
  fetchFn: typeof fetch = fetch,
  now = Date.now(),
): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "weather_code,cloud_cover",
    daily: "sunrise,sunset",
    timezone: "auto",
    forecast_days: "1",
  });
  const res = await fetchFn(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather lookup failed (${res.status})`);
  const data = (await res.json()) as {
    utc_offset_seconds: number;
    current: { weather_code: number; cloud_cover: number };
    daily: { sunrise: string[]; sunset: string[] };
  };
  const local = new Date(now + data.utc_offset_seconds * 1000).toISOString();
  return {
    localMinutes: minutesOf(local),
    sunrise: minutesOf(data.daily.sunrise[0]),
    sunset: minutesOf(data.daily.sunset[0]),
    weatherCode: data.current.weather_code ?? 0,
    cloudCover: data.current.cloud_cover ?? 0,
  };
}
